'use client';

import TimeCorrectionNotice from '@/app/components/chat/TimeCorrectionNotice';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, History, ImageDown, Mail } from 'lucide-react';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { getAuthToken, useUser } from '@/app/lib/auth';
import { trackEvent } from '@/app/lib/analytics/track';
import { getGuestAnalysis } from '@/app/lib/api';

import Markdown from '@/app/components/Markdown';
import { ChatHeader } from '@/app/components/chat/ChatHeader';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';

import {
  Msg, Paipan, QUICK_BUTTONS, normalizeMarkdown,
} from '@/app/lib/chat/types';
import { restoreStoredMessage } from '@/app/lib/chat/parser';
import { api, fetchQuickButtons, pickReply, readApiError } from '@/app/lib/chat/api';
import { trySSE, QuotaExhaustedError } from '@/app/lib/chat/sse';
import {
  saveConversation, loadConversation, getActiveConversationId,
  savePaipanLocal, repairCorruptedConversations, clearActiveConversationId,
} from '@/app/lib/chat/storage';
import { historyApi, ConversationUnavailableError, type TaskContext } from '@/app/lib/history/api';
import { QuotaChip } from '@/app/components/QuotaChip';
import QuotaExhaustedDialog from '@/app/components/QuotaExhaustedDialog';
import { useSavedBaziTurn } from '@/app/lib/chat/useSavedBaziTurn';
import { useBaziOpening } from '@/app/lib/chat/useBaziOpening';
import { TurnRecovery } from '@/app/components/chat/TurnRecovery';
import { ShareImageDialog } from '@/app/components/share/ShareImageDialog';

export default function ChatPage() {
  const router = useRouter();
  const { user: me } = useUser();
  const loading = useRouteGuard(true, true); // 需要登录和档案

  // ===== State =====
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<TaskContext | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [paipan, setPaipan] = useState<Paipan | null>(null);
  const [quickButtons, setQuickButtons] = useState(QUICK_BUTTONS);
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const regenerationLockRef = useRef(false);
  const chatViewTrackedRef = useRef(false);
  const firstMessageTrackedRef = useRef(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaDialogMessage, setQuotaDialogMessage] = useState('');
  const [viewingHistory, setViewingHistory] = useState(false);
  const [browserOnlyHistory, setBrowserOnlyHistory] = useState(false);
  const [scrollJumpDirection, setScrollJumpDirection] = useState<'top' | 'bottom'>('bottom');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const opening = useBaziOpening({ owner: me?.id,
    onQuotaExhausted: detail => {
      trackEvent('quota_paywall_shown', { payload: { surface: 'chat', type: 'chat' } });
      setQuotaDialogMessage(detail); setQuotaDialogOpen(true); setQuotaRefreshKey(key => key + 1);
    },
    onSource: status => {
      if (status.paipan) setPaipan(status.paipan);
      if ('task_context' in status) setTaskContext(status.task_context ?? null);
      if (status.state !== 'idle') setErr(null);
      if (status.conversation_id) {
        const cid = status.conversation_id;
        setConversationId(cid); sessionStorage.setItem('conversation_id', cid);
        const url = new URL(window.location.href);
        url.searchParams.set('conv_id', cid.replace(/^bazi_conv_/, ''));
        window.history.replaceState(window.history.state, '', url);
      }
    },
    onMessages: setMsgs,
    onSaved: detail => {
      setBrowserOnlyHistory(false); setErr(null); setTaskContext(detail.task_context ?? null);
      setMsgs(detail.messages.filter((message, index) => (message.role === 'user' || message.role === 'assistant')
        && !(index === 0 && message.role === 'user' && message.content.startsWith('我的命盘信息如下'))).map(restoreStoredMessage));
      const chart = detail.profile?.bazi_chart;
      const snapshot = chart && typeof chart.mingpan === 'object' ? chart.mingpan : chart;
      if (snapshot && typeof snapshot === 'object' && 'four_pillars' in snapshot) setPaipan(snapshot as Paipan);
      setQuotaRefreshKey(key => key + 1);
    },
  });
  const loadOpening = opening.load;
  const turn = useSavedBaziTurn({ owner: booting || opening.blocked ? undefined : me?.id, cid: conversationId, input, setMessages: setMsgs, setInput, taskContext,
    onRestored: detail => {
      setTaskContext(detail.task_context ?? null);
      setBrowserOnlyHistory(false);
      const chart = detail.profile?.bazi_chart;
      const snapshot = chart && typeof chart.mingpan === 'object' ? chart.mingpan : chart;
      if (snapshot && typeof snapshot === 'object' && 'four_pillars' in snapshot) setPaipan(snapshot as Paipan);
      setErr(null);
    } });

  function extractGuestMingpan(payload: unknown): Paipan | null {
    if (!payload || typeof payload !== 'object') return null;
    const result = payload as { mingpan?: unknown };
    const mingpan = result.mingpan;
    if (!mingpan || typeof mingpan !== 'object') return null;
    const candidate = mingpan as Paipan;
    if (!candidate.four_pillars || !Array.isArray(candidate.dayun)) return null;
    return candidate;
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const bottomAnchor = bottomAnchorRef.current;
    if (!bottomAnchor || !viewingHistory || msgs.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrollJumpDirection(entry.isIntersecting ? 'top' : 'bottom');
      },
      { threshold: 0.6 },
    );

    observer.observe(bottomAnchor);
    return () => observer.disconnect();
  }, [msgs.length, viewingHistory]);

  useEffect(() => {
    if (loading || chatViewTrackedRef.current) return;
    chatViewTrackedRef.current = true;
    trackEvent('chat_view', {
      payload: { surface: 'chat' },
    });
  }, [loading]);

  useEffect(() => {
    let alive = true;
    fetchQuickButtons().then((buttons) => {
      if (alive) setQuickButtons(buttons);
    });
    return () => { alive = false; };
  }, []);

  // 自动滚动
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, sending, booting]);

  // 触发顶部 QuotaChip 重取（每次发送/购买后调用）
  const refreshQuota = async () => {
    setQuotaRefreshKey((k) => k + 1);
  };

  // Bootstrap：从档案启动会话或恢复旧会话
  useEffect(() => {
    if (loading || !me?.id) return;
    let alive = true;

    (async () => {
      setBooting(true);

      // 修复损坏的对话数据
      try {
        const repairedCount = repairCorruptedConversations();
        if (repairedCount > 0) {
          console.log(`[Storage] Repaired ${repairedCount} corrupted conversations`);
        }
      } catch (e) {
        console.warn('[Storage] Failed to repair conversations:', e);
      }

      // 优先：从 URL ?conv_id=xxx 恢复历史会话
      const searchParams = new URLSearchParams(window.location.search);
      const urlConvId = searchParams.get('conv_id');
      const guestAnalysisPublicId = searchParams.get('guest_analysis_public_id');
      if (urlConvId) {
        setViewingHistory(true);
        try {
          const detail = await historyApi.detail(Number(urlConvId));
          if (!alive) return;
          if (detail.type !== 'bazi') {
            // 类型不匹配：六爻会话误进 /chat，跳到正确的页
            router.replace(`/liuyao?conv_id=${detail.id}`);
            return;
          }

          const cid = `bazi_conv_${detail.id}`;
          setTaskContext(detail.task_context ?? null);
          setInput((searchParams.get('question') || '').slice(0, 4000));
          // 命盘快照（恢复历史时优先用会话当时的快照）
          if (detail.profile?.bazi_chart) {
            const chart = detail.profile.bazi_chart as Record<string, unknown>;
            const mingpan = (chart?.mingpan as Record<string, unknown> | undefined) ?? chart;
            if (mingpan && (mingpan as { four_pillars?: unknown }).four_pillars) {
              const p = mingpan as unknown as Paipan;
              setPaipan(p);
              try { savePaipanLocal(p); } catch {}
            }
          }

          // 过滤掉后端注入的开场 user 消息（"我的命盘信息如下：..."）
          const filtered = detail.messages.filter((m, idx) => {
            if (idx === 0 && m.role === 'user' && m.content.startsWith('我的命盘信息如下')) {
              return false;
            }
            return m.role === 'user' || m.role === 'assistant';
          });
          const restoredMsgs: Msg[] = filtered.map(restoreStoredMessage);
          // 老版本可能生成了会话记录但尚未把消息写入数据库。
          // 此时优先保留浏览器中的同会话缓存，避免再被空数组覆盖。
          const cachedMsgs = loadConversation(cid);
          const displayMsgs = restoredMsgs.length > 0
            ? restoredMsgs
            : (cachedMsgs?.length ? cachedMsgs.filter(message => !message.streaming && !message.meta?.kind?.startsWith('turn:')).map(restoreStoredMessage) : []);
          setBrowserOnlyHistory(restoredMsgs.length === 0 && displayMsgs.length > 0);

          setConversationId(cid);
          setMsgs(displayMsgs);
          sessionStorage.setItem('conversation_id', cid);
          if (displayMsgs.length > 0) {
            saveConversation(cid, displayMsgs);
          } else {
            setErr('这条记录没有可显示的解读内容，可能是生成过程中页面关闭或网络中断。');
            await loadOpening({ cid }, false);
          }
          setBooting(false);
          return;
        } catch (e) {
          if (!alive) return;
          setErr(e instanceof Error ? e.message : '加载历史会话失败');
          setBooting(false);
          return;
        }
      }

      if (guestAnalysisPublicId) {
        try {
          const guestAnalysis = await getGuestAnalysis(guestAnalysisPublicId);
          if (!alive) return;
          const mingpan = extractGuestMingpan(guestAnalysis.bazi_result);
          if (mingpan) {
            setPaipan(mingpan);
            savePaipanLocal(mingpan);
          }
        } catch (e) {
          if (!alive) return;
          setErr(e instanceof Error ? e.message : '读取游客分析命盘失败');
          setBooting(false);
          return;
        }
      }

      // 尝试恢复旧会话。游客分析入口必须创建同一命盘的新会话，不能复用旧活跃会话。
      const active = guestAnalysisPublicId ? null : getActiveConversationId() || sessionStorage.getItem('conversation_id');
      if (active) {
        try {
          const detail = await historyApi.detail(Number(active.replace(/^(bazi_conv_|conv_)/, '')));
          if (!alive) return;
          if (detail.type !== 'bazi') { clearActiveConversationId(); }
          else {
            setConversationId(active);
            setTaskContext(detail.task_context ?? null);
            setMsgs(detail.messages.filter((message, index) => (message.role === 'user' || message.role === 'assistant')
              && !(index === 0 && message.role === 'user' && message.content.startsWith('我的命盘信息如下'))).map(restoreStoredMessage));
            const chart = detail.profile?.bazi_chart;
            const snapshot = chart && typeof chart.mingpan === 'object' ? chart.mingpan : chart;
            if (snapshot && typeof snapshot === 'object' && 'four_pillars' in snapshot) setPaipan(snapshot as Paipan);
            if (!detail.messages.length) await loadOpening({ cid: active }, false);
            setBooting(false);
            return;
          }
        } catch (failure) {
          if (!alive) return;
          if (failure instanceof ConversationUnavailableError && failure.status === 404) clearActiveConversationId();
          else { setErr('暂时无法读取已保存的会话，请重新加载。'); setBooting(false); return; }
        }
      }

      // Read the owned first request before starting. A refresh never retries
      // an unknown or failed generation automatically.
      try {
        sessionStorage.removeItem('conversation_id');
        await loadOpening({ body: guestAnalysisPublicId ? { guest_analysis_public_id: guestAnalysisPublicId } : {} }, true);
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => { alive = false; };
  }, [loading, router, me?.id, loadOpening]);

  // 持久化消息
  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs);
  }, [conversationId, msgs]);

  // ===== Helpers =====
  const historyRecordMissing = viewingHistory && msgs.length === 0 && !!err && !opening.blocked;

  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !sending && !booting && !historyRecordMissing && !browserOnlyHistory && !opening.blocked && !turn.blocked && !turn.busy,
    [conversationId, input, sending, booting, historyRecordMissing, browserOnlyHistory, opening.blocked, turn.blocked, turn.busy],
  );

  const canShareImage = useMemo(
    () => !!paipan || msgs.some((msg) => msg.role === 'assistant' && msg.content.trim() && !msg.streaming),
    [msgs, paipan],
  );

  const shareSource = useMemo(
    () => ({ kind: 'bazi' as const, paipan, messages: msgs }),
    [msgs, paipan],
  );

  const sendStream = async (content: string, displayMessage?: string) => {
    if (regenerationLockRef.current || browserOnlyHistory || opening.blocked || turn.blocked || turn.busy) return;
    regenerationLockRef.current = true;
    try { await turn.run(content, displayMessage); }
    finally { regenerationLockRef.current = false; void refreshQuota(); }
  };

  const handleQuotaExhausted = (e: QuotaExhaustedError) => {
    setErr(null);
    trackEvent('quota_paywall_shown', {
      payload: { surface: 'chat', type: 'chat' },
    });
    // 移除正在 streaming 的助手消息
    setMsgs((prev) => {
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

  const send = async () => {
    if (!conversationId || opening.blocked || regenerationLockRef.current || turn.blocked || turn.busy) {
      if (conversationId) return;
      setErr('缺少会话，请刷新页面重试');
      return;
    }
    const content = input.trim();
    if (!content) return;

    setErr(null);
    setInput('');
    setSending(true);
    if (!firstMessageTrackedRef.current) {
      firstMessageTrackedRef.current = true;
      trackEvent('chat_first_message_sent', {
        payload: { surface: 'chat', entry: 'manual' },
      });
    }

    try {
      await sendStream(content);
      void refreshQuota();
    } catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) {
        handleQuotaExhausted(e);
      } else {
        setErr(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setSending(false);
    }
  };

  const regenerate = async () => {
    if (!conversationId || sending || regenerationLockRef.current || browserOnlyHistory || opening.blocked || turn.blocked || turn.busy) return;
    const lastAssistantIdx = [...msgs].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'assistant')?.i;
    if (lastAssistantIdx == null) return;
    regenerationLockRef.current = true;
    setSending(true);
    setErr(null);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(api('/chat/regenerate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversation_id: conversationId, expected_message_id: msgs[lastAssistantIdx].meta?.messageId }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = await res.json();
      const full = pickReply(data).trim();
      if (!full) throw new Error('未收到完整解读，原回答已保留。');
      const newReply = normalizeMarkdown(full);

      setMsgs(prev => {
        return [...prev, { role: 'assistant', content: newReply,
          meta: { kind: 'regenerated', messageId: data.message_id } }];
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      regenerationLockRef.current = false;
      setSending(false);
    }
  };

  const sendQuick = async (label: string, fullPrompt: string) => {
    if (!conversationId || opening.blocked || regenerationLockRef.current || turn.blocked || turn.busy) {
      if (conversationId) return;
      setErr('缺少会话，请刷新页面重试');
      return;
    }
    setErr(null);
    setSending(true);
    if (!firstMessageTrackedRef.current) {
      firstMessageTrackedRef.current = true;
      trackEvent('chat_first_message_sent', {
        payload: { surface: 'chat', entry: 'quick_action', label },
      });
    }
    trackEvent('chat_suggested_question_click', {
      payload: { surface: 'chat', entry: 'quick_action', label },
    });
    try {
      await sendStream(fullPrompt, label);
      void refreshQuota();
    } catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) {
        handleQuotaExhausted(e);
      } else {
        setErr(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setSending(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    if (!conversationId || opening.blocked || sending || regenerationLockRef.current || turn.blocked || turn.busy) return;
    setErr(null);
    setSending(true);
    if (!firstMessageTrackedRef.current) {
      firstMessageTrackedRef.current = true;
      trackEvent('chat_first_message_sent', {
        payload: { surface: 'chat', entry: 'suggested_question' },
      });
    }
    trackEvent('chat_suggested_question_click', {
      payload: { surface: 'chat', entry: 'suggested_question' },
    });
    try {
      await sendStream(question);
      void refreshQuota();
    } catch (e: unknown) {
      if (e instanceof QuotaExhaustedError) {
        handleQuotaExhausted(e);
      } else {
        setErr(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      if (canSend) void send();
    }
  };

  const handleSimplify = async (idx: number) => {
    const msg = msgs[idx];
    if (!msg || msg.role !== 'assistant') return;
    if (msg.simplify?.status === 'loading') return;

    setMsgs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], simplify: { status: 'loading', content: '', expanded: true } };
      return next;
    });

    try {
      await trySSE(
        api('/chat/simplify'),
        { message_content: msg.content },
        (text) => {
          if (!mountedRef.current) return;
          setMsgs(prev => {
            const next = [...prev];
            if (next[idx]?.simplify?.status === 'loading') {
              next[idx] = {
                ...next[idx],
                simplify: { ...next[idx].simplify!, content: text, status: 'loading', expanded: true },
              };
            }
            return next;
          });
        },
      );

      setMsgs(prev => {
        const next = [...prev];
        if (next[idx]?.simplify) {
          next[idx] = { ...next[idx], simplify: { ...next[idx].simplify!, status: 'done' } };
        }
        return next;
      });
    } catch (e) {
      setMsgs(prev => {
        const next = [...prev];
        if (next[idx]?.simplify) {
          next[idx] = {
            ...next[idx],
            simplify: {
              ...next[idx].simplify!,
              status: 'error',
              error: e instanceof Error ? e.message : '生成失败',
            },
          };
        }
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

  const handleRated = async (messageIndex: number, rating: { ratingType: 'up' | 'down'; reason?: string }) => {
    setMsgs((prev) => {
      const next = [...prev];
      if (messageIndex >= 0 && messageIndex < next.length) {
        next[messageIndex] = {
          ...next[messageIndex],
          userRating: rating,
        };
      }
      return next;
    });
  };

  const handleScrollJump = () => {
    if (scrollJumpDirection === 'bottom') {
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return;
    }
    topAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <div className="text-neutral-600">加载中...</div>
      </div>
    );
  }

  return (
    <main className="reading-workspace min-h-screen bg-[#F7F3EE] text-neutral-800 px-4 py-6 sm:p-10">
      <div ref={topAnchorRef} aria-hidden="true" />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <ChatHeader
          conversationId={conversationId}
          onBack={() => router.push(viewingHistory ? '/history' : '/')}
          backLabel={viewingHistory ? '返回解读记录' : '返回首页'}
          rightExtra={(
            <>
              <button
                type="button"
                onClick={() => setShareDialogOpen(true)}
                disabled={!canShareImage}
                className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-white/90 px-3 py-1 text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImageDown className="h-3.5 w-3.5" aria-hidden="true" />
                保存分享图
              </button>
              <QuotaChip type="chat" refreshKey={quotaRefreshKey} />
            </>
          )}
        />

        <TimeCorrectionNotice info={paipan} />
        {(msgs.length > 0 || !opening.blocked) && <MessageList
          conversationId={conversationId}
          scrollRef={scrollRef}
          messages={msgs}
          Markdown={Markdown}
          paipanData={paipan ?? undefined}
          onRated={handleRated}
          onSimplify={handleSimplify}
          onSimplifyToggle={handleSimplifyToggle}
          onQuestionClick={handleQuestionClick}
          onRegenerate={regenerate}
          loading={booting || opening.blocked || sending || browserOnlyHistory || turn.blocked || turn.busy}
          emptyText={booting ? '正在读取解读记录…' : '这条记录暂无解读内容'}
          emptyTitle={historyRecordMissing ? '这条记录暂时没有可显示的解读内容' : undefined}
          emptyDescription={
            historyRecordMissing
              ? '可能是生成过程中页面被关闭、网络中断，或旧记录尚未保存完整。你可以返回解读记录查看其他内容；如果这条记录对你很重要，也可以联系客服协助排查。'
              : undefined
          }
          emptyAction={
            historyRecordMissing ? (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/history')}
                  className="btn btn-primary group"
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  返回解读记录
                </button>
                <Link href="/contact" className="btn btn-secondary group">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  联系客服
                </Link>
              </div>
            ) : undefined
          }
        />}

        {err && !opening.blocked && !turn.error && !turn.notice && !historyRecordMissing && (
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)]">
            <p className="font-medium text-[var(--color-primary)]">当前内容暂时无法加载</p>
            <p className="mt-2 leading-[1.7]">{err}</p>
          </div>
        )}

        {browserOnlyHistory && <p role="status" className="rounded-[24px] border border-[var(--color-border)] p-4 text-sm leading-7 text-[var(--color-text-secondary)]">
          这些旧内容仅保存在此浏览器，尚未核实服务端的完整记录。原文仍可阅读；新的问题可以<Link href="/panel" className="ml-1 text-[var(--color-primary)] underline underline-offset-4">开始新的咨询</Link>。
        </p>}
        {opening.blocked && <section aria-label="首次报告恢复" role="status" className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm leading-7 text-[var(--color-text-secondary)]">
          <p className="font-medium text-[var(--color-primary)]">
            {opening.phase === 'generating' ? '正在生成完整报告…' : opening.phase === 'checking' ? '正在检查报告保存状态…'
              : opening.phase === 'pending' ? '这份报告仍在生成中' : opening.phase === 'retryable' ? '这份报告尚未完成' : '报告保存状态暂未确认'}
          </p>
          <p className="mt-1">{opening.error || (opening.phase === 'pending' ? '重新加载会读取已有请求的保存结果，请稍后再检查。'
            : opening.phase === 'retryable' ? '原命盘与背景已保留，可以手动重试本次报告。' : '报告完整保存后即可继续追问。')}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {opening.phase === 'generating' ? <button type="button" className="btn btn-secondary" onClick={opening.stop}>停止生成报告</button>
              : <button type="button" className="btn btn-secondary" disabled={opening.busy} onClick={() => void opening.reload()}>重新加载首次报告</button>}
            {opening.phase === 'retryable' && <button type="button" className="btn btn-primary" onClick={() => void opening.retry()}>重试生成完整报告</button>}
          </div>
        </section>}
        {!opening.blocked && <TurnRecovery {...turn} />}
        <QuickActions
          disabled={sending || booting || opening.blocked || !conversationId || historyRecordMissing || browserOnlyHistory || turn.blocked || turn.busy}
          buttons={quickButtons}
          onClick={sendQuick}
        />

        <InputArea
          value={input}
          onChange={turn.onInputChange}
          onKeyDown={onKeyDown}
          canSend={canSend}
          sending={sending}
          disabled={booting || opening.blocked || !conversationId || historyRecordMissing || browserOnlyHistory || (turn.busy && !sending)}
          onSend={send}
          onRegenerate={regenerate}
          showRegenerate={false}
          onStop={turn.stop}
        />
        <div ref={bottomAnchorRef} aria-hidden="true" />
      </div>

      <QuotaExhaustedDialog
        open={quotaDialogOpen}
        onClose={() => setQuotaDialogOpen(false)}
        title="八字次数已用完"
        message={quotaDialogMessage}
      />

      <ShareImageDialog
        open={shareDialogOpen}
        source={shareSource}
        onClose={() => setShareDialogOpen(false)}
      />

      {viewingHistory && msgs.length > 0 && (
        <button
          type="button"
          onClick={handleScrollJump}
          aria-label={scrollJumpDirection === 'bottom' ? '跳到对话底部' : '回到对话顶部'}
          title={scrollJumpDirection === 'bottom' ? '到底部' : '回顶部'}
          className="fixed bottom-24 right-4 z-40 inline-flex rounded-full min-h-12 min-w-12 items-center justify-center gap-2 border border-[var(--color-primary)]/25 bg-[var(--color-bg-elevated)]/95 px-3 text-sm font-medium text-[var(--color-primary)] shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 sm:bottom-8 sm:right-8 sm:px-4"
        >
          {scrollJumpDirection === 'bottom' ? (
            <ArrowDown className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {scrollJumpDirection === 'bottom' ? '到底部' : '回顶部'}
          </span>
        </button>
      )}
    </main>
  );
}
