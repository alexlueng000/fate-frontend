'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, FileText, Edit3, Trash2, ChevronDown } from 'lucide-react';

import Markdown from '@/app/components/Markdown';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';
import { MiniPillars } from '@/app/components/chat/MiniPillars';

import { Msg, QUICK_BUTTONS, normalizeMarkdown } from '@/app/lib/chat/types';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { api, fetchBaziIntro, fetchQuickButtons, pickReply } from '@/app/lib/chat/api';
import { trySSE, QuotaExhaustedError } from '@/app/lib/chat/sse';
import { QuotaBar } from '@/app/components/QuotaBar';
import QuotaExhaustedDialog from '@/app/components/QuotaExhaustedDialog';
import {
  saveConversation, loadConversation, getActiveConversationId,
  repairCorruptedConversations,
} from '@/app/lib/chat/storage';
import {
  loadCareerTaskContext,
  takePendingCareerBaziPrompt,
  type CareerTaskContext,
} from '@/app/lib/tasks/career';
import { useUser, fetchMe } from '@/app/lib/auth';

interface Profile {
  id: number;
  gender: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  calendar?: string;
}

interface FourPillarsData {
  year?: string[];
  month?: string[];
  day?: string[];
  hour?: string[];
}

function HeaderMenu({
  id, onReport, onEditProfile, onClear,
}: { id?: string; onReport: () => void; onEditProfile: () => void; onClear: () => void }) {
  return (
    <div
      id={id}
      role="menu"
      aria-orientation="vertical"
      className="absolute right-0 top-11 z-50 min-w-[160px] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)]"
    >
      <button
        role="menuitem"
        onClick={onReport}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] focus-visible:bg-[var(--color-bg-hover)] focus-visible:outline-none transition-colors text-left"
      >
        <FileText className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" aria-hidden />
        查看命理报告
      </button>
      <div className="h-px bg-[var(--color-border)]" role="separator" />
      <button
        role="menuitem"
        onClick={onEditProfile}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] focus-visible:bg-[var(--color-bg-hover)] focus-visible:outline-none transition-colors text-left"
      >
        <Edit3 className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" aria-hidden />
        修改资料
      </button>
      <div className="h-px bg-[var(--color-border)]" role="separator" />
      <button
        role="menuitem"
        onClick={onClear}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] focus-visible:bg-[var(--color-bg-hover)] focus-visible:outline-none transition-colors text-left"
      >
        <Trash2 className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" aria-hidden />
        清空对话
      </button>
    </div>
  );
}

export default function PanelPage() {
  const router = useRouter();

  const aiIndexRef = useRef<number | null>(null);
  const streamingLockRef = useRef(false);
  const lastFullRef = useRef('');
  const mountedRef = useRef(true);
  const autoTaskStartedRef = useRef(false);
  const pendingAutoPromptRef = useRef<string | null>(null);
  // Two refs: collapsed row + expanded row each render their own more-menu container.
  // Both stay mounted (only CSS-hidden), so the outside-click handler checks both.
  const menuRefCollapsed = useRef<HTMLDivElement>(null);
  const menuRefExpanded = useRef<HTMLDivElement>(null);

  const { user: me, setUser } = useUser();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fourPillars, setFourPillars] = useState<FourPillarsData | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  // Mobile header collapse. Default collapsed on first visit to reclaim vertical space;
  // sm+ viewports ignore this state (the summary row is hidden via CSS).
  const [headerExpanded, setHeaderExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('panel_header_expanded') === '1';
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('panel_header_expanded', headerExpanded ? '1' : '0');
  }, [headerExpanded]);

  const [qbLoading, setQbLoading] = useState(true);
  const [quickButtons, setQuickButtons] = useState<Array<{ label: string; prompt: string }>>(QUICK_BUTTONS);
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaDialogMessage, setQuotaDialogMessage] = useState('');
  const [taskContext, setTaskContext] = useState<CareerTaskContext | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const task = params.get('task');
    const auto = params.get('auto');
    if (task === 'career') {
      setTaskContext(loadCareerTaskContext());
      if (auto === '1') {
        pendingAutoPromptRef.current = takePendingCareerBaziPrompt();
      }
    }
  }, []);

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

  // Close menu on outside click — check both menu containers since both stay mounted.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideCollapsed = menuRefCollapsed.current?.contains(target);
      const insideExpanded = menuRefExpanded.current?.contains(target);
      if (!insideCollapsed && !insideExpanded) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showMenu]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // 触发 QuotaBar 重取（每次发送/购买后调用）
  const refreshQuota = async () => {
    setQuotaRefreshKey((k) => k + 1);
  };

  const handleQuotaExhausted = (e: QuotaExhaustedError) => {
    setErr(null);
    // 移除正在 streaming 的助手消息
    setMsgs(prev => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === 'assistant' && next[i].streaming) {
          next.splice(i, 1);
          break;
        }
      }
      return next;
    });
    // 显示弹窗
    setQuotaDialogMessage(e.detail);
    setQuotaDialogOpen(true);
    void refreshQuota();
  };

  // Quick buttons from admin
  useEffect(() => {
    (async () => {
      try {
        setQuickButtons(await fetchQuickButtons());
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
          const introContent = await fetchBaziIntro();
          const restored = cached.map(m => {
            const nextMsg = m.simplify?.status === 'loading'
              ? { ...m, simplify: { ...m.simplify, status: 'error' as const, error: '已中断，请重试' } }
              : m;

            return nextMsg.meta?.kind === 'intro'
              ? { ...nextMsg, content: introContent }
              : nextMsg;
          });
          setConversationId(active);
          setMsgs(restored);
          saveConversation(active, restored);
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

        const introContent = await fetchBaziIntro();
        const introMsg: Msg = { role: 'assistant', content: introContent, meta: { kind: 'intro' } };
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

  // Fetch four pillars after profile loads
  useEffect(() => {
    if (!profile) return;
    let alive = true;
    (async () => {
      try {
        const gender = profile.gender === 'male' || profile.gender === '男' ? '男' :
                       profile.gender === 'female' || profile.gender === '女' ? '女' : profile.gender;
        const birthTime = (profile.birth_time || '').slice(0, 5); // HH:MM
        const res = await fetch(api('/bazi/calc_paipan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            gender,
            calendar: profile.calendar || 'gregorian',
            birth_date: profile.birth_date,
            birth_time: birthTime,
            birthplace: profile.birth_location,
            use_true_solar: true,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const fp = data?.mingpan?.four_pillars;
        if (alive && fp) setFourPillars(fp);
      } catch { /* ignore – header will keep showing skeleton */ }
    })();
    return () => { alive = false; };
  }, [profile]);

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
  const sendOnce = async (content: string, retryOnSessionLost = true, displayMessage?: string) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(api('/chat'), {
      method: 'POST', headers,
      body: JSON.stringify({
        conversation_id: conversationId,
        message: content,
        display_message: displayMessage,
        task_context: taskContext,
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      // Check if session is lost
      if (retryOnSessionLost && errorText.includes('会话不存在')) {
        const newCid = await reinitSession();
        // Retry with new conversation_id
        const retryRes = await fetch(api('/chat'), {
          method: 'POST', headers,
          body: JSON.stringify({
            conversation_id: newCid,
            message: content,
            display_message: displayMessage,
            task_context: taskContext,
          }),
        });
        if (!retryRes.ok) throw new Error(await retryRes.text());
        return pickReply(await retryRes.json()).trim();
      }
      throw new Error(errorText);
    }
    return pickReply(await res.json()).trim();
  };

  const sendStream = async (content: string, retryOnSessionLost = true, displayMessage?: string) => {
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
        {
          conversation_id: conversationId,
          message: content,
          display_message: displayMessage,
          task_context: taskContext,
        },
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
          await sendStream(content, false, displayMessage);
          return;
        } catch {
          // If retry fails, fall through to sendOnce
        }
      }

      const full = await sendOnce(content, false, displayMessage);
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
    try { await sendStream(content); void refreshQuota(); }
    catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) handleQuotaExhausted(e);
      else setErr(e instanceof Error ? e.message : String(e));
    }
    finally { setLoading(false); }
  };

  const sendHiddenTaskPrompt = async (content: string, displayMessage: string) => {
    if (!conversationId || streamingLockRef.current) return;
    setErr(null);
    setMsgs(m => [...m, { role: 'user', content: displayMessage }]);
    setLoading(true);
    try {
      await sendStream(content, true, displayMessage);
      void refreshQuota();
    } catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) handleQuotaExhausted(e);
      else setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoTaskStartedRef.current || !conversationId || booting || loading) return;
    const prompt = pendingAutoPromptRef.current;
    if (!prompt || !taskContext || taskContext.mode !== 'bazi') return;

    autoTaskStartedRef.current = true;
    pendingAutoPromptRef.current = null;
    const visibleMessage = taskContext.title || '事业选择分析';
    void sendHiddenTaskPrompt(prompt, visibleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, conversationId, loading, taskContext]);

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
    try { await sendStream(fullPrompt); void refreshQuota(); }
    catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) handleQuotaExhausted(e);
      else setErr(e instanceof Error ? e.message : String(e));
    }
    finally { setLoading(false); }
  };

  const handleQuestionClick = async (question: string) => {
    if (!conversationId || streamingLockRef.current) return;
    setErr(null);
    setMsgs(m => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try { await sendStream(question); void refreshQuota(); }
    catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) handleQuotaExhausted(e);
      else setErr(e instanceof Error ? e.message : String(e));
    }
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

  const dayPillar = (fourPillars?.day?.[0] || '') + (fourPillars?.day?.[1] || '');

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)]">

      {/* Profile status bar */}
      <header className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <h1 className="sr-only">八字对话 · 当前命盘</h1>

        {/* Mobile collapsed summary — single 44px row. Hidden on sm+ and when expanded on mobile. */}
        <div className={`sm:hidden ${headerExpanded ? 'hidden' : 'flex'} items-center gap-2 px-4 h-11`}>
          <button
            type="button"
            onClick={() => setHeaderExpanded(true)}
            aria-expanded={false}
            aria-controls="panel-header-details"
            className="min-w-0 flex-1 flex items-center gap-2 -mx-1 px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 rounded-[var(--radius-sm)]"
          >
            {profile ? (
              <>
                <span className="font-serif text-[15px] font-medium text-[var(--color-primary)] tabular-nums flex-shrink-0">
                  {dayPillar || '—'}
                </span>
                <span className="text-[var(--color-text-hint)] flex-shrink-0">·</span>
                <span className="font-sans text-[13px] text-[var(--color-text-body)] truncate">
                  {genderLabel}
                  <span className="mx-1 text-[var(--color-text-hint)]">·</span>
                  <span className="tabular-nums">{profile.birth_date}</span>
                </span>
              </>
            ) : (
              <span className="font-sans text-xs text-[var(--color-text-muted)]">加载中…</span>
            )}
            <ChevronDown
              className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 ml-auto"
              aria-hidden
            />
          </button>

          {/* More menu stays available in the collapsed state */}
          <div className="relative flex-shrink-0" ref={menuRefCollapsed}>
            <button
              onClick={() => setShowMenu(v => !v)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowMenu(false); }}
              className="w-10 h-10 -mr-2 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
              aria-label="更多操作"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              aria-controls="panel-header-menu-collapsed"
            >
              <MoreVertical className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
            {showMenu && <HeaderMenu
              id="panel-header-menu-collapsed"
              onReport={() => { setShowMenu(false); router.push('/report'); }}
              onEditProfile={() => { setShowMenu(false); router.push('/profile/edit?returnTo=/panel'); }}
              onClear={() => {
                setShowMenu(false);
                if (window.confirm('确认清空当前对话内容？此操作不可恢复。')) void clearChat();
              }}
            />}
          </div>
        </div>

        {/* Expanded details — always visible on sm+, toggleable on mobile */}
        <div
          id="panel-header-details"
          className={`${headerExpanded ? 'block' : 'hidden'} sm:block`}
        >
          <div className="px-4 pt-3 pb-2 flex items-start gap-3 sm:gap-4">
            {/* Left: eyebrow + birth meta */}
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-[var(--color-text-muted)] mb-1.5">
                当前命盘
              </p>
              {profile ? (
                <p className="font-serif text-[13px] sm:text-[14px] leading-[1.5] text-[var(--color-text-body)] truncate">
                  <span className="text-[var(--color-text-primary)] font-medium">{genderLabel}</span>
                  <span className="mx-1.5 text-[var(--color-text-hint)]">·</span>
                  <span className="text-[var(--color-text-primary)] font-medium tabular-nums">{profile.birth_date}</span>
                  <span className="mx-1 text-[var(--color-text-hint)]">·</span>
                  <span className="text-[var(--color-text-primary)] font-medium tabular-nums">
                    {profile.birth_time?.slice(0, 5)}
                  </span>
                  <span className="mx-1.5 text-[var(--color-text-hint)]">·</span>
                  <span className="text-[var(--color-text-secondary)]">{profile.birth_location}</span>
                </p>
              ) : (
                <p className="font-sans text-xs text-[var(--color-text-muted)]">加载中…</p>
              )}
            </div>

            {/* Right: mobile collapse trigger + more menu */}
            <div className="flex items-center flex-shrink-0 -mt-0.5 gap-0.5">
              {/* Collapse button — mobile only */}
              <button
                type="button"
                onClick={() => setHeaderExpanded(false)}
                className="sm:hidden w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
                aria-label="收起命盘"
                aria-expanded
                aria-controls="panel-header-details"
              >
                <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] rotate-180" />
              </button>

              <div className="relative" ref={menuRefExpanded}>
                <button
                  onClick={() => setShowMenu(v => !v)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setShowMenu(false); }}
                  className="w-11 h-11 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-primary-glow)]"
                  aria-label="更多操作"
                  aria-haspopup="menu"
                  aria-expanded={showMenu}
                  aria-controls="panel-header-menu-expanded"
                >
                  <MoreVertical className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
                {showMenu && <HeaderMenu
                  id="panel-header-menu-expanded"
                  onReport={() => { setShowMenu(false); router.push('/report'); }}
                  onEditProfile={() => { setShowMenu(false); router.push('/profile/edit?returnTo=/panel'); }}
                  onClear={() => {
                    setShowMenu(false);
                    if (window.confirm('确认清空当前对话内容？此操作不可恢复。')) void clearChat();
                  }}
                />}
              </div>
            </div>
          </div>

          {/* Pillars row sits below the meta line on every screen size */}
          <div className="px-4 pb-3 pt-1">
            <MiniPillars fourPillars={fourPillars} loading={!fourPillars && !!profile} />
          </div>
        </div>
      </header>

      {/* Quota strip — sits below profile/pillars row */}
      <QuotaBar type="chat" refreshKey={quotaRefreshKey} />

      {/* Messages — flex-1, MessageList owns the scroll */}
      <MessageList
        scrollRef={scrollRef}
        messages={msgs}
        Markdown={Markdown}
        onRated={handleRated}
        onSimplify={handleSimplify}
        onSimplifyToggle={handleSimplifyToggle}
        onQuestionClick={handleQuestionClick}
        onRegenerate={regenerate}
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
            <div
              role="alert"
              className="rounded-[var(--radius-sm)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-3 py-2 text-xs text-[var(--color-primary-deeper)]"
            >
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
          showRegenerate={false}
          showClear={false}
          placeholder="问我一个你现在最关心的问题…"
        />
        <p className="text-center text-[12px] leading-5 text-[var(--color-text-muted)]">
          内容仅供娱乐参考，请理性看待。
        </p>
      </div>

      <QuotaExhaustedDialog
        open={quotaDialogOpen}
        onClose={() => setQuotaDialogOpen(false)}
        title="八字次数已用完"
        message={quotaDialogMessage}
      />
    </div>
  );
}
