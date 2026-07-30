'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { getAuthToken } from '@/app/lib/auth';
import { trackEvent } from '@/app/lib/analytics/track';

import Markdown from '@/app/components/Markdown';
import { ChatHeader } from '@/app/components/chat/ChatHeader';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';

import {
  Msg, Paipan, QUICK_BUTTONS, normalizeMarkdown,
} from '@/app/lib/chat/types';
import { parseSuggestedQuestions, restoreStoredMessage } from '@/app/lib/chat/parser';
import { api, fetchQuickButtons, pickReply } from '@/app/lib/chat/api';
import { trySSE, QuotaExhaustedError } from '@/app/lib/chat/sse';
import {
  saveConversation, loadConversation, getActiveConversationId,
  savePaipanLocal, loadPaipanLocal, repairCorruptedConversations,
} from '@/app/lib/chat/storage';
import { historyApi } from '@/app/lib/history/api';
import { QuotaChip } from '@/app/components/QuotaChip';
import QuotaExhaustedDialog from '@/app/components/QuotaExhaustedDialog';

export default function ChatPage() {
  const router = useRouter();
  const loading = useRouteGuard(true, true); // 需要登录和档案

  // ===== State =====
  const [conversationId, setConversationId] = useState<string | null>(null);
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
  const chatViewTrackedRef = useRef(false);
  const firstMessageTrackedRef = useRef(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaDialogMessage, setQuotaDialogMessage] = useState('');
  const [viewingHistory, setViewingHistory] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 安全读取 conversation_id
  function readConversationId(meta: unknown): string {
    if (typeof meta !== 'object' || meta === null) return '';
    const v = (meta as Record<string, unknown>)['conversation_id'];
    return typeof v === 'string' ? v : '';
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    updateBackToTopVisibility();
    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateBackToTopVisibility);
  }, []);

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
    if (loading) return;
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
      const urlConvId = new URLSearchParams(window.location.search).get('conv_id');
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
            : (cachedMsgs?.length ? cachedMsgs.map(restoreStoredMessage) : []);

          setConversationId(cid);
          setMsgs(displayMsgs);
          sessionStorage.setItem('conversation_id', cid);
          if (displayMsgs.length > 0) {
            saveConversation(cid, displayMsgs);
          } else {
            setErr('这条记录没有可显示的解读内容，可能是生成过程中页面关闭或网络中断。');
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

      // 尝试恢复旧会话
      const active = getActiveConversationId() || sessionStorage.getItem('conversation_id');
      if (active) {
        const cached = loadConversation(active);
        if (cached?.length) {
          if (!alive) return;
          setConversationId(active);
          setMsgs(cached.map(m =>
            m.simplify?.status === 'loading'
              ? { ...m, simplify: { ...m.simplify, status: 'error' as const, error: '已中断，请重试' } }
              : m
          ));
          const cachedPaipan = loadPaipanLocal();
          if (cachedPaipan) setPaipan(cachedPaipan);

          setBooting(false);
          return;
        }
      }

      // 没有旧会话，从档案启动新会话
      try {
        const token = getAuthToken();
        if (!token) {
          setErr('未登录，请重新登录');
          setBooting(false);
          return;
        }

        // 清理旧会话ID
        sessionStorage.removeItem('conversation_id');

        // 启动新会话（后端自动从档案读取命盘）
        let assistantIndex = -1;
        setMsgs(() => {
          const next: Msg[] = [{ role: 'assistant', content: '', streaming: true }];
          assistantIndex = 0;
          return next;
        });

        await trySSE(
          api('/chat/start'),
          {}, // 不传 paipan，后端从档案读取
          (text) => {
            if (!alive) return;
            setMsgs((prev) => {
              const next = [...prev];
              if (assistantIndex >= 0 && assistantIndex < next.length) {
                next[assistantIndex] = {
                  ...next[assistantIndex],
                  // trySSE 回调的是截至当前的完整正文，不是单个 token。
                  // 继续相加会把每次完整快照重复拼进同一条回复。
                  content: text,
                };
              }
              return next;
            });
          },
          (meta) => {
            if (!alive) return;
            const cid = readConversationId(meta);
            if (cid) {
              sessionStorage.setItem('conversation_id', cid);
              setConversationId(cid);
            }
          }
        );

        // 流结束，解析推荐问题
        if (!alive) return;
        let finalText = '';
        setMsgs((prev) => {
          const next = [...prev];
          if (assistantIndex >= 0 && assistantIndex < next.length) {
            const { questions, cleanedContent } = parseSuggestedQuestions(next[assistantIndex].content || '');
            const normalized = normalizeMarkdown(cleanedContent);
            next[assistantIndex] = {
              ...next[assistantIndex],
              content: normalized,
              streaming: false,
              suggestedQuestions: questions,
            };
            finalText = normalized;
          }
          return next;
        });

        const cid = sessionStorage.getItem('conversation_id');
        if (cid) {
          saveConversation(cid, [{ role: 'assistant', content: finalText }]);
        }
      } catch (e: unknown) {
        if (!alive) return;
        if (e instanceof QuotaExhaustedError) {
          handleQuotaExhausted(e);
        } else {
          setErr(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => { alive = false; };
  }, [loading, router]);

  // 持久化消息
  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs);
  }, [conversationId, msgs]);

  // ===== Helpers =====
  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !sending && !booting,
    [conversationId, input, sending, booting],
  );

  const sendStream = async (content: string, displayMessage?: string) => {
    if (!conversationId) throw new Error('缺少会话，请刷新页面重试');

    let assistantIndex = -1;
    setMsgs((prev) => {
      const next: Msg[] = [...prev, { role: 'assistant', content: '', streaming: true }];
      assistantIndex = next.length - 1;
      return next;
    });

    const replaceStreamingText = (text: string) => {
      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        next[assistantIndex] = { ...next[assistantIndex], content: text };
        return next;
      });
    };

    try {
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content, display_message: displayMessage },
        replaceStreamingText,
        (meta) => {
          if (!mountedRef.current) return;
          const cid = readConversationId(meta);
          if (cid) {
            sessionStorage.setItem('conversation_id', cid);
            setConversationId(cid);
          }
        }
      );

      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        const { questions, cleanedContent } = parseSuggestedQuestions(next[assistantIndex].content);
        const normalized = normalizeMarkdown(cleanedContent);
        next[assistantIndex] = {
          ...next[assistantIndex],
          content: normalized,
          streaming: false,
          suggestedQuestions: questions,
        };
        return next;
      });
    } catch {
      // 降级为一次性
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(api('/chat'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversation_id: conversationId, message: content, display_message: displayMessage }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const full = pickReply(data).trim();
      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        const { questions, cleanedContent } = parseSuggestedQuestions(full);
        next[assistantIndex] = {
          role: 'assistant',
          content: normalizeMarkdown(cleanedContent || '（后端未返回解读内容）'),
          suggestedQuestions: questions,
        };
        return next;
      });
    }
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
    if (!conversationId) {
      setErr('缺少会话，请刷新页面重试');
      return;
    }
    const content = input.trim();
    if (!content) return;

    setErr(null);
    setMsgs((m) => [...m, { role: 'user', content }]);
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
    if (!conversationId) return;
    const lastAssistantIdx = [...msgs].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'assistant')?.i;
    if (lastAssistantIdx == null) return;

    setSending(true);
    setErr(null);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(api('/chat/regenerate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const newReply = normalizeMarkdown(pickReply(data).trim() || '（后端未返回解读内容）');

      setMsgs(prev => {
        const next = [...prev];
        next[lastAssistantIdx] = { role: 'assistant', content: newReply };
        return next;
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const sendQuick = async (label: string, fullPrompt: string) => {
    if (!conversationId) {
      setErr('缺少会话，请刷新页面重试');
      return;
    }
    setErr(null);
    setMsgs((m) => [...m, { role: 'user', content: label }]);
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
      await sendStream(fullPrompt, `${label}分析`);
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
    if (!conversationId || sending) return;
    setErr(null);
    setMsgs((m) => [...m, { role: 'user', content: question }]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <div className="text-neutral-600">加载中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EE] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <ChatHeader
          conversationId={conversationId}
          onBack={() => router.push(viewingHistory ? '/history' : '/')}
          backLabel={viewingHistory ? '返回解读记录' : '返回首页'}
          rightExtra={<QuotaChip type="chat" refreshKey={quotaRefreshKey} />}
        />

        <MessageList
          scrollRef={scrollRef}
          messages={msgs}
          Markdown={Markdown}
          paipanData={paipan ?? undefined}
          onRated={handleRated}
          onSimplify={handleSimplify}
          onSimplifyToggle={handleSimplifyToggle}
          onQuestionClick={handleQuestionClick}
          loading={sending}
          emptyText={booting ? '正在读取解读记录…' : '这条记录暂无解读内容'}
        />

        {(booting || sending) && (
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 border border-red-200 p-3 text-sm text-neutral-800">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
            {booting ? '正在解读中…' : '发送中…'}
          </div>
        )}
        {err && (
          <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            错误：{err}
          </div>
        )}

        <QuickActions
          disabled={sending || booting || !conversationId}
          buttons={quickButtons}
          onClick={sendQuick}
        />

        <InputArea
          value={input}
          onChange={setInput}
          onKeyDown={onKeyDown}
          canSend={canSend}
          sending={sending}
          disabled={booting || !conversationId}
          onSend={send}
          onRegenerate={regenerate}
        />
      </div>

      <QuotaExhaustedDialog
        open={quotaDialogOpen}
        onClose={() => setQuotaDialogOpen(false)}
        title="八字次数已用完"
        message={quotaDialogMessage}
      />

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="回到对话顶部"
          title="回到顶部"
          className="fixed bottom-6 right-4 z-40 inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-red-200 bg-white/95 px-3 text-sm font-medium text-red-800 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:bottom-8 sm:right-8 sm:px-4"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">回到顶部</span>
        </button>
      )}
    </main>
  );
}
