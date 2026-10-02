'use client';

import TimeCorrectionNotice from '@/app/components/chat/TimeCorrectionNotice';
import { ReadingLink } from '@/app/components/consultation/ReadingLink';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, FileText, Edit3, Trash2, ArrowUp, Sparkles, ArrowUpRight } from 'lucide-react';

import Markdown from '@/app/components/Markdown';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';
import { ContextDrawer } from '@/app/components/consultation/primitives';
import { ReviewNotes } from '@/app/components/consultation/ReviewNotes';
import { MiniPillars } from '@/app/components/chat/MiniPillars';

import { Msg, QUICK_BUTTONS, normalizeMarkdown } from '@/app/lib/chat/types';
import { parseSuggestedQuestions, restoreStoredMessage } from '@/app/lib/chat/parser';
import { api, fetchBaziIntro, fetchQuickButtons, pickReply, readApiError } from '@/app/lib/chat/api';
import { trySSE, QuotaExhaustedError } from '@/app/lib/chat/sse';
import { useSavedBaziTurn } from '@/app/lib/chat/useSavedBaziTurn';
import { TurnRecovery } from '@/app/components/chat/TurnRecovery';
import { historyApi, ConversationUnavailableError, type ConversationDetailResp } from '@/app/lib/history/api';
import { QuotaBar } from '@/app/components/QuotaBar';
import QuotaExhaustedDialog from '@/app/components/QuotaExhaustedDialog';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import {
  saveConversation, getActiveConversationId,
  repairCorruptedConversations, clearActiveConversationId,
} from '@/app/lib/chat/storage';
import { trackEvent } from '@/app/lib/analytics/track';
import {
  loadCareerTaskContext,
  takePendingCareerBaziPrompt, clearPendingCareerBaziPrompt,
  type CareerTaskContext,
} from '@/app/lib/tasks/career';
import {
  loadRelationshipTaskContext,
  takePendingRelationshipBaziPrompt,
  type RelationshipTaskContext,
} from '@/app/lib/tasks/relationship';
import { useUser, fetchMe, getAuthToken } from '@/app/lib/auth';

type PanelTaskContext = CareerTaskContext | RelationshipTaskContext;

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

  const streamingLockRef = useRef(false);
  const mountedRef = useRef(true);
  const autoTaskStartedRef = useRef(false);
  const pendingAutoPromptRef = useRef<string | null>(null);
  const panelViewTrackedRef = useRef(false);
  const firstMessageTrackedRef = useRef(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const menuRefCollapsed = useRef<HTMLDivElement>(null);

  const { user: me, setUser } = useUser();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const hasDiscussion = msgs.some(m => m.role === 'user' || (m.role === 'assistant' && m.meta?.kind !== 'intro'));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeCorrection, setTimeCorrection] = useState<import('@/app/lib/chat/types').TimeCorrectionInfo | null>(null);
  const [fourPillars, setFourPillars] = useState<FourPillarsData | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [qbLoading, setQbLoading] = useState(true);
  const [quickButtons, setQuickButtons] = useState<Array<{ label: string; prompt: string }>>(QUICK_BUTTONS);
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaDialogMessage, setQuotaDialogMessage] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [taskContext, setTaskContext] = useState<PanelTaskContext | null>(null);
  const savedChartRef = useRef<Record<string, unknown> | null>(null);
  const [savedChart, setSavedChart] = useState<Record<string, unknown> | null>(null);
  const [profileChanged, setProfileChanged] = useState(false);

  const applySavedContext = (detail: ConversationDetailResp) => {
    setTaskContext(detail.task_context ?? null);
    const chart = detail.profile?.bazi_chart;
    const snapshot = chart && typeof chart.mingpan === 'object' ? chart.mingpan as Record<string, unknown> : chart ?? null;
    savedChartRef.current = snapshot; setSavedChart(snapshot); setProfileChanged(!!detail.profile_changed);
    if (snapshot?.four_pillars) {
      setFourPillars(snapshot.four_pillars as FourPillarsData);
      setTimeCorrection(snapshot);
    }
  };
  const turn = useSavedBaziTurn({ owner: me?.id, cid: conversationId, input, setMessages: setMsgs, setInput,
    taskContext, onRestored: applySavedContext });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuestion = params.get('q');
    if (initialQuestion) {
      setInput(initialQuestion);
      trackEvent('panel_prefill_question', {
        payload: { source: 'report', length: initialQuestion.length },
      });
    }
    const task = params.get('task');
    const auto = params.get('auto');
    if (task === 'career') {
      setTaskContext(loadCareerTaskContext());
      if (auto === '1') {
        pendingAutoPromptRef.current ||= takePendingCareerBaziPrompt();
      }
    } else if (task === 'relationship') {
      setTaskContext(loadRelationshipTaskContext());
      if (auto === '1') {
        pendingAutoPromptRef.current ||= takePendingRelationshipBaziPrompt();
      }
    }
  }, []);

  // ===== Helpers =====


  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    const updateBackToTopVisibility = () => {
      setShowBackToTop(scrollContainer.scrollTop > 600);
    };
    updateBackToTopVisibility();
    scrollContainer.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', updateBackToTopVisibility);
  }, [hasDiscussion]);

  useEffect(() => {
    if (panelViewTrackedRef.current) return;
    panelViewTrackedRef.current = true;
    trackEvent('chat_view', {
      payload: { surface: 'panel' },
    });
  }, []);

  // Close menu on outside click — check both menu containers since both stay mounted.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideCollapsed = menuRefCollapsed.current?.contains(target);
      if (!insideCollapsed) setShowMenu(false);
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
    trackEvent('quota_paywall_shown', {
      payload: { surface: 'panel', type: 'chat' },
    });
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
      const returnTo = '/panel' + window.location.search;
      if (!currentUser) { router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`); return; }
      if (!me) setUser(currentUser);

      const token = getAuthToken();
      if (!token) { router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`); return; }

      // Fetch profile
      try {
        const profileRes = await fetch(api('/profile/me'), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (!profileRes.ok) { router.replace(`/profile/create?next=${encodeURIComponent(returnTo)}`); return; }
        const profileData = await profileRes.json();
        if (!profileData) { router.replace(`/profile/create?next=${encodeURIComponent(returnTo)}`); return; }
        if (alive) setProfile(profileData);
      } catch {
        // profile fetch failed, continue anyway
      }

      // Try restore existing session
      const active = getActiveConversationId() || sessionStorage.getItem('conversation_id');
      const startingTask = new URLSearchParams(window.location.search).get('auto') === '1';
      if (active && !startingTask) {
        try {
          const detail = await historyApi.detail(Number(active.replace(/^(bazi_conv_|conv_)/, '')));
          if (!alive) return;
          if (detail.type !== 'bazi') { clearActiveConversationId(); }
          else {
            applySavedContext(detail);
            const introContent = await fetchBaziIntro();
            if (!alive) return;
            const rows = detail.messages.filter((message, index) => (message.role === 'user' || message.role === 'assistant')
              && !(index === 0 && message.role === 'user' && message.content.startsWith('我的命盘信息如下')));
            const restored: Msg[] = rows.length ? rows.map(restoreStoredMessage)
              : [{ role: 'assistant', content: introContent, meta: { kind: 'intro' } }];
            setConversationId(active);
            setMsgs(restored);
            saveConversation(active, restored);
            return;
          }
        } catch (failure) {
          if (!alive) return;
          if (failure instanceof ConversationUnavailableError && failure.status === 404) clearActiveConversationId();
          else { setErr('暂时无法读取已保存的会话，请重新加载。'); return; }
        }
      }

      // No session → call /chat/init to get conversation_id, show static intro
      // Backend will load user's bazi from database and store in session
      if (!alive) return;
      setBooting(true);

      try {
        const token = getAuthToken();
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
    if (!profile || savedChartRef.current) return;
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
        if (alive && fp && !savedChartRef.current) {
          setFourPillars(fp);
          setTimeCorrection(data.mingpan);
        }
      } catch { /* ignore – header will keep showing skeleton */ }
    })();
    return () => { alive = false; };
  }, [profile, conversationId]);

  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !loading && !booting && !turn.blocked && !turn.busy,
    [conversationId, input, loading, booting, turn.blocked, turn.busy],
  );

  // ===== Send / Stream =====
  const sendStream = async (content: string, displayMessage?: string) => {
    if (!conversationId) throw new Error('缺少会话，请刷新页面重试');
    if (streamingLockRef.current) return;
    streamingLockRef.current = true;

    try { await turn.run(content, displayMessage); }
    finally { void refreshQuota(); streamingLockRef.current = false; }
  };

  const send = async () => {
    if (!conversationId || streamingLockRef.current || turn.blocked || turn.busy) return;
    const content = input.trim();
    if (!content) return;
    setErr(null);
    setInput('');
    setLoading(true);
    if (!firstMessageTrackedRef.current) {
      firstMessageTrackedRef.current = true;
      trackEvent('chat_first_message_sent', {
        payload: { surface: 'panel', entry: 'manual' },
      });
    }
    try { await sendStream(content); void refreshQuota(); }
    catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) handleQuotaExhausted(e);
      else setErr(e instanceof Error ? e.message : String(e));
    }
    finally { setLoading(false); }
  };

  const sendHiddenTaskPrompt = async (content: string, displayMessage: string) => {
    if (!conversationId || streamingLockRef.current || turn.blocked || turn.busy) return;
    setErr(null);
    setLoading(true);
    try {
      await sendStream(content, displayMessage);
      void refreshQuota();
    } catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) handleQuotaExhausted(e);
      else setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoTaskStartedRef.current || !me?.id || !conversationId || booting || loading || turn.blocked || turn.busy) return;
    const prompt = pendingAutoPromptRef.current;
    if (!prompt || !taskContext || taskContext.mode !== 'bazi') return;

    autoTaskStartedRef.current = true;
    if (taskContext.taskType === 'career') clearPendingCareerBaziPrompt();
    const url = new URL(window.location.href);
    url.searchParams.delete('auto');
    window.history.replaceState(window.history.state, '', url);
    pendingAutoPromptRef.current = null;
    const visibleMessage = taskContext.title || '任务分析';
    void sendHiddenTaskPrompt(prompt, visibleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, conversationId, loading, taskContext, me?.id, turn.blocked, turn.busy]);

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); if (canSend) void send(); }
  };

  const regenerate = async () => {
    if (!conversationId || regenerating || streamingLockRef.current || turn.blocked || turn.busy) return;
    const lastIdx = [...msgs].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'assistant')?.i;
    if (lastIdx == null) return;
    streamingLockRef.current = true;
    setErr(null);
    setRegenerating(true);
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(api('/chat/regenerate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversation_id: conversationId, expected_message_id: msgs[lastIdx].meta?.messageId }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = await res.json();
      const full = pickReply(data).trim();
      if (!full) throw new Error('未收到完整解读，原回答已保留。');
      const { questions, cleanedContent } = parseSuggestedQuestions(full);
      const newReply = normalizeMarkdown(cleanedContent || '（后端未返回解读内容）');
      setMsgs(prev => {
        return [...prev, { role: 'assistant', content: newReply, suggestedQuestions: questions,
          meta: { kind: 'regenerated', messageId: data.message_id } }];
      });
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally {
      streamingLockRef.current = false;
      setRegenerating(false);
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!conversationId || streamingLockRef.current || turn.blocked || turn.busy) return;
    streamingLockRef.current = true;
    setErr(null);
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(api('/chat/clear'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: 'include',
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = await res.json().catch(() => null);
      if (!data?.ok || typeof data.conversation_id !== 'string' || data.conversation_id === conversationId) throw new Error(data?.error || '未能确认新会话，请重新加载。');
      const cid = data.conversation_id;
      // Clearing removes the conversation history/context, but the page should
      // immediately return to its ready state instead of the empty loading
      // placeholder. Reuse the admin-managed opening message.
      const introContent = await fetchBaziIntro();
      const introMsg: Msg = {
        role: 'assistant',
        content: introContent,
        meta: { kind: 'intro' },
      };
      // Publish the new ID and its empty context together. While the intro is
      // loading, the persistence effect must not copy old messages to this ID.
      setConversationId(cid);
      savedChartRef.current = null; setSavedChart(null); setProfileChanged(false);
      setTaskContext(null);
      pendingAutoPromptRef.current = '';
      setInput('');
      setMsgs([introMsg]);
      saveConversation(cid, [introMsg]);
      sessionStorage.setItem('conversation_id', cid);
      router.replace('/panel');
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { streamingLockRef.current = false; setLoading(false); }
  };

  const sendQuick = async (label: string, fullPrompt: string) => {
    if (!conversationId || streamingLockRef.current || turn.blocked || turn.busy) return;
    setErr(null);
    setLoading(true);
    if (!firstMessageTrackedRef.current) {
      firstMessageTrackedRef.current = true;
      trackEvent('chat_first_message_sent', {
        payload: { surface: 'panel', entry: 'quick_action', label },
      });
    }
    trackEvent('chat_suggested_question_click', {
      payload: { surface: 'panel', entry: 'quick_action', label },
    });
    try { await sendStream(fullPrompt, label); void refreshQuota(); }
    catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) handleQuotaExhausted(e);
      else setErr(e instanceof Error ? e.message : String(e));
    }
    finally { setLoading(false); }
  };

  const handleQuestionClick = async (question: string) => {
    if (!conversationId || streamingLockRef.current || turn.blocked || turn.busy) return;
    setErr(null);
    setLoading(true);
    if (!firstMessageTrackedRef.current) {
      firstMessageTrackedRef.current = true;
      trackEvent('chat_first_message_sent', {
        payload: { surface: 'panel', entry: 'suggested_question' },
      });
    }
    trackEvent('chat_suggested_question_click', {
      payload: { surface: 'panel', entry: 'suggested_question' },
    });
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

  const canUseQuick = !qbLoading && !loading && !booting && !!conversationId && !turn.blocked && !turn.busy;

  // ===== Profile summary =====
  const genderLabel = profile?.gender === 'male' || profile?.gender === '男' ? '男' :
    profile?.gender === 'female' || profile?.gender === '女' ? '女' : (profile?.gender ?? '');


  return (
    <div className="reading-workspace h-full min-h-0 flex flex-col">

      <header className="reading-header">
        <div className="reading-header-inner">
          <div className="min-w-0 flex-1">
            <p className="consult-eyebrow">{taskContext?.taskType === 'career' ? '事业咨询 · 把下一步想清楚' : '八字对话 · 慢慢聊，慢慢理清'}</p>
            <h1 className="font-serif text-xl sm:text-2xl leading-relaxed">{taskContext?.title || '从你在意的一件事开始'}</h1>
          </div>
          <div className="reading-tools">
            <ContextDrawer title="命盘与背景" description="查看本次解读使用的档案、排盘说明与现实背景。" trigger={<button className="reading-pill">命盘与背景</button>}>
              <p className="mb-5 text-sm leading-7">{savedChart
                ? `本次会话保存的命盘${typeof savedChart.solar_date === 'string' ? ` · 排盘时间 ${savedChart.solar_date}` : ''}`
                : `${genderLabel} · ${profile?.birth_date || ''} · ${profile?.birth_time?.slice(0, 5) || ''} · ${profile?.birth_location || ''}`}</p>
              {profileChanged && <p className="mb-4 text-sm leading-6 text-[var(--color-text-secondary)]">档案后来有过修改，本次对话继续使用保存时的命盘。</p>}
              <MiniPillars fourPillars={fourPillars} loading={!fourPillars && !!profile} />
              <div className="mt-5"><TimeCorrectionNotice info={timeCorrection} /></div>
              {taskContext?.taskType === 'career' && <>
                <p className="my-5 whitespace-pre-wrap leading-7">{taskContext.facts?.currentSituation || '尚未补充现实背景'}</p>
                {conversationId && Number(conversationId.replace(/\D/g, '')) > 0 && <ReviewNotes conversationId={Number(conversationId.replace(/\D/g, ''))} context={taskContext} />}
              </>}
              <Link className="reading-pill mt-5 inline-flex" href="/profile/edit?returnTo=/panel">编辑出生档案</Link>
              <ReadingLink conversationId={conversationId} />
            </ContextDrawer>
            <QuotaBar type="chat" refreshKey={quotaRefreshKey} compact />
            <div className="relative" ref={menuRefCollapsed}>
              <button aria-label="更多操作" aria-haspopup="menu" aria-expanded={showMenu} className="consult-icon-button" onClick={() => setShowMenu(v => !v)} onKeyDown={e => { if (e.key === 'Escape') setShowMenu(false); }}><MoreVertical size={18} /></button>
              {showMenu && <HeaderMenu id="panel-header-menu" onReport={() => { setShowMenu(false); router.push('/report'); }} onEditProfile={() => { setShowMenu(false); router.push('/profile/edit?returnTo=/panel'); }} onClear={() => { setShowMenu(false); setClearDialogOpen(true); }} />}
            </div>
          </div>
        </div>
      </header>

      {/* Messages — flex-1, MessageList owns the scroll */}
      <div className="relative flex min-h-0 flex-1">
        {!hasDiscussion ? <div className="reading-welcome" ref={scrollRef}>
          <div className="reading-welcome-inner">
            <span className="reading-mark"><Sparkles size={25} strokeWidth={1.3} /></span>
            <p className="consult-eyebrow mt-6">给自己一点思考的空间</p>
            <h2 className="font-serif text-3xl sm:text-4xl leading-snug">最近，有什么事放在心上？</h2>
            <p className="reading-welcome-copy">可以从一个困惑、一段关系，或一个新的选择聊起。结合你的命盘，我们一起整理思路，找到可以尝试的下一步。</p>
            <Link href="/career" className="reading-career-card"><span><span className="block font-serif text-xl">把事业问题想清楚</span><span className="mt-2 block text-sm text-[var(--color-text-secondary)]">职业方向、工作瓶颈，或一个正在犹豫的机会</span></span><ArrowUpRight size={22} /></Link>
            <p className="mb-3 mt-7 text-xs text-[var(--color-text-muted)]">也可以从这里聊起</p>
            <div className="flex flex-wrap gap-2">{quickButtons.slice(0, 4).map(button => <button className="reading-pill" key={button.label} disabled={!canUseQuick} onClick={() => sendQuick(button.label, button.prompt)}>{button.label}</button>)}</div>
          </div>
        </div> : <MessageList
          conversationId={conversationId}
          containerClassName="reading-messages"
          scrollRef={scrollRef}
          messages={msgs.filter(m => m.meta?.kind !== 'intro')}
          Markdown={Markdown}
          onRated={handleRated}
          onSimplify={handleSimplify}
          onSimplifyToggle={handleSimplifyToggle}
          onQuestionClick={handleQuestionClick}
          onRegenerate={regenerate}
          regenerating={regenerating}
          loading={loading || turn.blocked || turn.busy}
        />}
        {showBackToTop && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="回到对话顶部"
            title="回到顶部"
            className="absolute bottom-4 right-4 z-40 inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-bg-elevated)]/95 px-3 text-sm font-medium text-[var(--color-primary)] shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 sm:px-4"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">回到顶部</span>
          </button>
        )}
      </div>

      {/* Inline error below messages. Loading is shown inside the pending assistant reply. */}
      {err && !turn.error && !turn.notice && <div role="alert" className="flex-shrink-0 px-4 pb-2 text-sm text-[var(--color-primary-deeper)]">{err}</div>}
      <div className="px-4 pb-2"><TurnRecovery {...turn} /></div>
      <footer className="reading-footer">
        <div className="reading-composer">
          <InputArea value={input} onChange={turn.onInputChange} onKeyDown={onKeyDown}
            canSend={canSend} sending={loading} disabled={booting || !conversationId || (turn.busy && !loading)}
            onSend={send} onRegenerate={regenerate}
            onStop={turn.stop}
            showRegenerate={false} showClear={false}
            placeholder={taskContext ? '围绕这个问题，继续聊聊你的想法…' : '说说你现在最在意的事…'} />
          <div className="reading-composer-meta"><Link href="/career">事业咨询 <ArrowUpRight size={12} /></Link><span>Enter 发送 · Shift+Enter 换行</span></div>
        </div>
        <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">传统文化视角与现实思考参考，决定由你做出。</p>
      </footer>

      <QuotaExhaustedDialog
        open={quotaDialogOpen}
        onClose={() => setQuotaDialogOpen(false)}
        title="八字次数已用完"
        message={quotaDialogMessage}
      />
      <ConfirmDialog
        open={clearDialogOpen}
        title="清空当前对话？"
        message={'将开始一段空白对话，不再沿用当前问题和背景。\n原对话与报告保留在解读记录中，随时可以重新打开。'}
        confirmLabel="确认清空"
        busy={loading}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={() => {
          setClearDialogOpen(false);
          void clearChat();
        }}
      />
    </div>
  );
}
