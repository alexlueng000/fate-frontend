'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { getAuthToken } from '@/app/lib/auth';

import Markdown from '@/app/components/Markdown';
import { WuxingBadge, WuxingBar, getWuxing, colorClasses } from '@/app/components/WuXing';
import { ChatHeader } from '@/app/components/chat/ChatHeader';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';

import {
  Msg, Paipan, QUICK_BUTTONS, normalizeMarkdown,
} from '@/app/lib/chat/types';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { api, pickReply } from '@/app/lib/chat/api';
import { trySSE } from '@/app/lib/chat/sse';
import {
  saveConversation, loadConversation, getActiveConversationId,
  savePaipanLocal, loadPaipanLocal, repairCorruptedConversations,
} from '@/app/lib/chat/storage';

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
  const [quota, setQuota] = useState<{ remaining: number; is_unlimited: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

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

  // 自动滚动
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, sending, booting]);

  // 获取配额
  useEffect(() => {
    if (loading) return;
    const token = getAuthToken();
    if (!token) return;
    fetch(api('/quota/me'), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setQuota({ remaining: data.remaining, is_unlimited: data.is_unlimited }); })
      .catch(() => {});
  }, [loading]);

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
          (delta) => {
            if (!alive) return;
            setMsgs((prev) => {
              const next = [...prev];
              if (assistantIndex >= 0 && assistantIndex < next.length) {
                next[assistantIndex] = {
                  ...next[assistantIndex],
                  content: next[assistantIndex].content + delta,
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
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => { alive = false; };
  }, [loading]);

  // 持久化消息
  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs);
  }, [conversationId, msgs]);

  // ===== Helpers =====
  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !sending && !booting,
    [conversationId, input, sending, booting],
  );

  const sendStream = async (content: string) => {
    if (!conversationId) throw new Error('缺少会话，请刷新页面重试');

    let assistantIndex = -1;
    setMsgs((prev) => {
      const next: Msg[] = [...prev, { role: 'assistant', content: '', streaming: true }];
      assistantIndex = next.length - 1;
      return next;
    });

    const append = (delta: string) => {
      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        next[assistantIndex] = { ...next[assistantIndex], content: next[assistantIndex].content + delta };
        return next;
      });
    };

    try {
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content },
        append,
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
        body: JSON.stringify({ conversation_id: conversationId, message: content }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const full = pickReply(data).trim();
      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        next[assistantIndex] = { role: 'assistant', content: normalizeMarkdown(full || '（后端未返回解读内容）') };
        return next;
      });
    }
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

    try {
      await sendStream(content);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
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
    setMsgs((m) => [...m, { role: 'user', content: `${label}分析` }]);
    setSending(true);
    try {
      await sendStream(fullPrompt);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    if (!conversationId || sending) return;
    setErr(null);
    setMsgs((m) => [...m, { role: 'user', content: question }]);
    setSending(true);
    try {
      await sendStream(question);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
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
          onBack={() => router.push('/')}
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
          buttons={QUICK_BUTTONS}
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
          quota={quota}
        />
      </div>
    </main>
  );
}
