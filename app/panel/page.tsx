'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, FileText, Edit3 } from 'lucide-react';

import Markdown from '@/app/components/Markdown';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';

import { Msg, QUICK_BUTTONS, normalizeMarkdown } from '@/app/lib/chat/types';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { api, pickReply } from '@/app/lib/chat/api';
import { trySSE } from '@/app/lib/chat/sse';
import {
  saveConversation, loadConversation, getActiveConversationId,
  repairCorruptedConversations,
} from '@/app/lib/chat/storage';
import { SYSTEM_INTRO } from '@/app/lib/chat/constants';
import { useUser, fetchMe } from '@/app/lib/auth';

interface Profile {
  id: number;
  gender: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
}

export default function PanelPage() {
  const router = useRouter();

  const aiIndexRef = useRef<number | null>(null);
  const streamingLockRef = useRef(false);
  const lastFullRef = useRef('');
  const mountedRef = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user: me, setUser } = useUser();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [qbLoading, setQbLoading] = useState(true);
  const [quickButtons, setQuickButtons] = useState<Array<{ label: string; prompt: string }>>(QUICK_BUTTONS);
  const [quota, setQuota] = useState<{ remaining: number; is_unlimited: boolean } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ===== Helpers =====
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

  function hasConversationId(x: unknown): x is { conversation_id: string } {
    return isRecord(x) && 'conversation_id' in x && typeof (x as { conversation_id: string }).conversation_id === 'string';
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // Quota
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch('/api/quota/me', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setQuota({ remaining: data.remaining, is_unlimited: data.is_unlimited }); })
      .catch(() => {});
  }, []);

  // Quick buttons from admin
  function parseQbValue(v: unknown): { items?: Array<{ label: string; prompt: string; order?: number; active?: boolean }>; maxCount?: number } {
    if (!v) return {};
    if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
    return v as ReturnType<typeof parseQbValue>;
  }

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(api('/admin/config?key=quick_buttons'), { credentials: 'include', cache: 'no-store' });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        const parsed = parseQbValue(data.value_json);
        const list = Array.isArray(parsed.items) ? parsed.items : [];
        const filtered = list.filter(it => it?.active !== false && it?.label && it?.prompt);
        const sorted = filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const sliced = sorted.slice(0, Math.max(1, parsed.maxCount ?? 12));
        if (sliced.length > 0) setQuickButtons(sliced.map(({ label, prompt }) => ({ label, prompt })));
      } catch { /* use defaults */ }
      finally { setQbLoading(false); }
    })();
  }, []);

  // Auth + profile check + session bootstrap
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const repairedCount = repairCorruptedConversations();
        if (repairedCount > 0) console.log(`[Storage] Repaired ${repairedCount}`);
      } catch {}

      const currentUser = me ?? await fetchMe();
      if (!currentUser) { router.replace('/login?redirect=/panel'); return; }
      if (!me) setUser(currentUser);

      const token = localStorage.getItem('auth_token');
      if (!token) { router.replace('/login?redirect=/panel'); return; }

      // Fetch profile
      try {
        const profileRes = await fetch(api('/profile/me'), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (!profileRes.ok) { router.replace('/profile/create'); return; }
        const profileData = await profileRes.json();
        if (!profileData) { router.replace('/profile/create'); return; }
        if (alive) setProfile(profileData);
      } catch {
        // profile fetch failed, continue anyway
      }

      // Try restore existing session
      const active = getActiveConversationId() || sessionStorage.getItem('conversation_id');
      if (active) {
        const cached = loadConversation(active);
        if (cached?.length && alive) {
          setConversationId(active);
          setMsgs(cached.map(m =>
            m.simplify?.status === 'loading'
              ? { ...m, simplify: { ...m.simplify, status: 'error' as const, error: '已中断，请重试' } }
              : m
          ));
          return;
        }
      }

      // No session → call /chat/init to get conversation_id, show static intro
      // Backend will load user's bazi from database and store in session
      if (!alive) return;
      setBooting(true);

      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const initRes = await fetch(api('/chat/init'), {
          method: 'POST',
          headers,
          credentials: 'include',
        });
        if (!initRes.ok) throw new Error(await initRes.text());
        const { conversation_id: cid } = await initRes.json();

        if (!alive) return;
        sessionStorage.setItem('conversation_id', cid);
        setConversationId(cid);

        const introMsg: Msg = { role: 'assistant', content: SYSTEM_INTRO, meta: { kind: 'intro' } };
        setMsgs([introMsg]);
        saveConversation(cid, [introMsg]);
      } catch (e: unknown) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist messages
  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs);
  }, [conversationId, msgs]);

  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !loading && !booting,
    [conversationId, input, loading, booting],
  );

  // ===== Reinitialize session =====
  const reinitSession = async () => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const initRes = await fetch(api('/chat/init'), {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    if (!initRes.ok) throw new Error(await initRes.text());
    const { conversation_id: cid } = await initRes.json();

    sessionStorage.setItem('conversation_id', cid);
    setConversationId(cid);
    return cid;
  };

  // ===== Send / Stream =====
  const sendOnce = async (content: string, retryOnSessionLost = true) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(api('/chat'), {
      method: 'POST', headers,
      body: JSON.stringify({ conversation_id: conversationId, message: content }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      // Check if session is lost
      if (retryOnSessionLost && errorText.includes('会话不存在')) {
        const newCid = await reinitSession();
        // Retry with new conversation_id
        const retryRes = await fetch(api('/chat'), {
          method: 'POST', headers,
          body: JSON.stringify({ conversation_id: newCid, message: content }),
        });
        if (!retryRes.ok) throw new Error(await retryRes.text());
        return pickReply(await retryRes.json()).trim();
      }
      throw new Error(errorText);
    }
    return pickReply(await res.json()).trim();
  };

  const sendStream = async (content: string, retryOnSessionLost = true) => {
    if (!conversationId) throw new Error('缺少会话，请刷新页面重试');
    if (streamingLockRef.current) return;
    streamingLockRef.current = true;

    let myIndex = -1;
    setMsgs(prev => {
      const next: Msg[] = [...prev, { role: 'assistant', content: '', streaming: true }];
      myIndex = next.length - 1;
      aiIndexRef.current = myIndex;
      return next;
    });

    const replace = (fullText: string) => {
      if (fullText === lastFullRef.current) return;
      lastFullRef.current = fullText;
      setMsgs(prev => {
        if (myIndex < 0 || myIndex >= prev.length) return prev;
        const next = [...prev];
        next[myIndex] = { ...next[myIndex], content: fullText };
        return next;
      });
    };

    try {
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content },
        replace,
        (meta) => {
          const cid = hasConversationId(meta) ? meta.conversation_id : '';
          if (cid) { sessionStorage.setItem('conversation_id', cid); setConversationId(cid); }
          const msgId = isRecord(meta) ? meta.message_id : undefined;
          if (msgId) {
            setMsgs(prev => {
              if (myIndex < 0 || myIndex >= prev.length) return prev;
              const next = [...prev];
              next[myIndex] = { ...next[myIndex], meta: { ...next[myIndex].meta, messageId: msgId as number } };
              return next;
            });
          }
        }
      );
      setMsgs(prev => {
        if (myIndex < 0 || myIndex >= prev.length) return prev;
        const next = [...prev];
        const { questions, cleanedContent } = parseSuggestedQuestions(next[myIndex].content || '');
        const normalized = normalizeMarkdown(cleanedContent);
        next[myIndex] = { ...next[myIndex], streaming: false, content: normalized, suggestedQuestions: questions };
        return next;
      });
    } catch (e) {
      // Check if session is lost and retry
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (retryOnSessionLost && errorMsg.includes('会话不存在')) {
        try {
          await reinitSession();
          // Retry once with new session
          streamingLockRef.current = false;
          await sendStream(content, false);
          return;
        } catch (retryError) {
          // If retry fails, fall through to sendOnce
        }
      }

      const full = await sendOnce(content, false);
      setMsgs(prev => {
        if (myIndex < 0 || myIndex >= prev.length) return prev;
        const next = [...prev];
        const { questions, cleanedContent } = parseSuggestedQuestions(full || '（后端未返回解读内容）');
        const normalized = normalizeMarkdown(cleanedContent);
        next[myIndex] = { role: 'assistant', streaming: false, content: normalized, suggestedQuestions: questions };
        return next;
      });
    } finally {
      streamingLockRef.current = false;
      lastFullRef.current = '';
    }
  };

  const send = async () => {
    if (!conversationId || streamingLockRef.current) return;
    const content = input.trim();
    if (!content) return;
    setErr(null);
    setMsgs(m => [...m, { role: 'user', content }]);
    setInput('');
    setLoading(true);
    try { await sendStream(content); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); if (canSend) void send(); }
  };

  const regenerate = async () => {
    if (!conversationId) return;
    const lastIdx = [...msgs].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'assistant')?.i;
    if (lastIdx == null) return;
    setLoading(true);
    try {
      const res = await fetch(api('/chat/regenerate'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const newReply = normalizeMarkdown(pickReply(await res.json()).trim() || '（后端未返回解读内容）');
      setMsgs(prev => { const next = [...prev]; next[lastIdx] = { role: 'assistant', content: newReply }; return next; });
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  const clearChat = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await fetch(api('/chat/clear'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json().catch(() => null);
      if (!data?.ok) throw new Error(data?.error || '清空失败');
      setMsgs([]);
      saveConversation(conversationId, []);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  const sendQuick = async (label: string, fullPrompt: string) => {
    if (!conversationId || streamingLockRef.current) return;
    setErr(null);
    setMsgs(m => [...m, { role: 'user', content: `${label}分析` }]);
    setLoading(true);
    try { await sendStream(fullPrompt); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  const handleQuestionClick = async (question: string) => {
    if (!conversationId || streamingLockRef.current) return;
    setErr(null);
    setMsgs(m => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try { await sendStream(question); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };

  const handleRated = (messageIndex: number, rating: { ratingType: 'up' | 'down'; reason?: string }) => {
    setMsgs(prev => {
      const next = [...prev];
      if (messageIndex >= 0 && messageIndex < next.length) next[messageIndex] = { ...next[messageIndex], userRating: rating };
      return next;
    });
  };

  const handleSimplify = async (idx: number) => {
    const msg = msgs[idx];
    if (!msg || msg.role !== 'assistant' || msg.simplify?.status === 'loading') return;
    setMsgs(prev => { const next = [...prev]; next[idx] = { ...next[idx], simplify: { status: 'loading', content: '', expanded: true } }; return next; });
    try {
      await trySSE(api('/chat/simplify'), { message_content: msg.content }, (text) => {
        if (!mountedRef.current) return;
        setMsgs(prev => {
          const next = [...prev];
          if (next[idx]?.simplify?.status === 'loading') {
            next[idx] = { ...next[idx], simplify: { ...next[idx].simplify!, content: text, status: 'loading', expanded: true } };
          }
          return next;
        });
      });
      setMsgs(prev => { const next = [...prev]; if (next[idx]?.simplify) next[idx] = { ...next[idx], simplify: { ...next[idx].simplify!, status: 'done' } }; return next; });
    } catch (e) {
      setMsgs(prev => {
        const next = [...prev];
        if (next[idx]?.simplify) next[idx] = { ...next[idx], simplify: { ...next[idx].simplify!, status: 'error', error: e instanceof Error ? e.message : '生成失败' } };
        return next;
      });
    }
  };

  const handleSimplifyToggle = (idx: number) => {
    setMsgs(prev => {
      const next = [...prev];
      const simplify = next[idx]?.simplify;
      if (!simplify) return prev;
      next[idx] = { ...next[idx], simplify: { ...simplify, expanded: !simplify.expanded } };
      return next;
    });
  };

  const canUseQuick = !qbLoading && !loading && !booting && !!conversationId;

  // ===== Profile summary =====
  const genderLabel = profile?.gender === 'male' || profile?.gender === '男' ? '男' :
    profile?.gender === 'female' || profile?.gender === '女' ? '女' : (profile?.gender ?? '');
  const profileSummary = profile
    ? `${genderLabel} · ${profile.birth_date} ${profile.birth_time} · ${profile.birth_location}`
    : '';

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)]">

      {/* Profile status bar */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium tracking-widest text-[var(--color-text-muted)] uppercase">当前命盘</p>
          <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{profileSummary || '加载中…'}</p>
        </div>
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-hover)] hover:bg-[var(--color-border)] transition-colors"
            aria-label="更多操作"
          >
            <MoreVertical className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 z-50 min-w-[148px] rounded-xl overflow-hidden border border-[var(--color-border)] bg-white shadow-lg">
              <button
                onClick={() => { setShowMenu(false); router.push('/report'); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                查看命理报告
              </button>
              <div className="h-px bg-[var(--color-border)]" />
              <button
                onClick={() => { setShowMenu(false); router.push('/profile/edit?returnTo=/panel'); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <Edit3 className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                修改资料
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages — flex-1, MessageList owns the scroll */}
      <MessageList
        scrollRef={scrollRef}
        messages={msgs}
        Markdown={Markdown}
        onRated={handleRated}
        onSimplify={handleSimplify}
        onSimplifyToggle={handleSimplifyToggle}
        onQuestionClick={handleQuestionClick}
        loading={loading}
      />

      {/* Inline status below messages (booting / error) */}
      {(booting || err) && (
        <div className="flex-shrink-0 px-4 pb-1">
          {booting && (
            <div className="flex items-center gap-2 py-1.5 text-xs text-[var(--color-text-muted)]">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)]" />
              正在解读中…
            </div>
          )}
          {err && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600">
              {err}
            </div>
          )}
        </div>
      )}

      {/* Bottom bar: quick actions + input */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 sm:px-3 pt-2 pb-2 space-y-2">
        <QuickActions
          disabled={!canUseQuick}
          buttons={quickButtons}
          onClick={sendQuick}
        />
        <InputArea
          value={input}
          onChange={setInput}
          onKeyDown={onKeyDown}
          canSend={canSend}
          sending={loading}
          disabled={booting || !conversationId}
          onSend={send}
          onRegenerate={regenerate}
          onStop={() => {}}
          onClear={clearChat}
          confirmClear={true}
          quota={quota}
          placeholder="问我一个你现在最关心的问题…"
        />
      </div>
    </div>
  );
}
