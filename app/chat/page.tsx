'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Markdown from '@/app/components/Markdown';
import { Wuxing, WuxingBadge, WuxingBar, getWuxing, colorClasses, guessElementPercent } from '@/app/components/WuXing';

import { ChatHeader } from '@/app/components/chat/ChatHeader';
import { PaipanCard } from '@/app/components/chat/PaipanCard';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';

import {
  Msg, Paipan, QUICK_BUTTONS,
  readPaipanParamsFromURL, normalizeMarkdown,
} from '@/app/lib/chat/types';
import { api, pickReply } from '@/app/lib/chat/api';
import { trySSE } from '@/app/lib/chat/sse';
import {
  saveConversation, loadConversation, getActiveConversationId,
  savePaipanLocal, loadPaipanLocal,
} from '@/app/lib/chat/storage';

export default function ChatPage() {
  const router = useRouter();

  // ===== State =====
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [paipan, setPaipan] = useState<Paipan | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ===== Effects =====
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // Bootstrap：URL参数 → 计算命盘 → chat/start（流式）；否则恢复会话
  useEffect(() => {
    let alive = true;

    (async () => {
      setBooting(true);

      const cachedPaipan = loadPaipanLocal();
      if (cachedPaipan) setPaipan(cachedPaipan);

      const urlPayload = readPaipanParamsFromURL();
      if (urlPayload) {
        try {
          // 开新会话前清理旧ID
          sessionStorage.removeItem('conversation_id');

          // 计算命盘
          const calcRes = await fetch(api('/bazi/calc_paipan'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(urlPayload),
          });
          if (!calcRes.ok) throw new Error(await calcRes.text());
          const calcData = await calcRes.json();
          const mingpan = calcData?.mingpan as Paipan | undefined;
          if (!mingpan) throw new Error('后端未返回命盘（mingpan）。');

          setPaipan(mingpan);
          savePaipanLocal(mingpan);

          // ===== 初始化会话：优先流式，失败回退 =====
          try {
            // 先插入一个占位 assistant，边流追加内容
            let assistantIndex = -1;
            setMsgs(() => {
              const next: Msg[] = [{ role: 'assistant', content: '' }];
              assistantIndex = 0;
              return next;
            });

            let cidLocal = '';
            await trySSE(
              api('/chat/start'),
              { paipan: mingpan },
              // onDelta：追加增量
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
              // onMeta：拿到 conversation_id
              (meta) => {
                if (!alive) return;
                const cid = String(meta?.conversation_id || '');
                if (cid) {
                  sessionStorage.setItem('conversation_id', cid);
                  setConversationId(cid);
                  cidLocal = cid;
                }
              },
            );

            // 流结束 → 归一化 + 持久化
            if (!alive) return;
            let finalText = '';
            setMsgs((prev) => {
              const next = [...prev];
              if (assistantIndex >= 0 && assistantIndex < next.length) {
                const normalized = normalizeMarkdown(next[assistantIndex].content || '');
                next[assistantIndex] = { ...next[assistantIndex], content: normalized };
                finalText = normalized;
              }
              return next;
            });

            if (cidLocal) {
              saveConversation(cidLocal, [{ role: 'assistant', content: finalText }]);
            } else {
              // 如果后端没有通过 meta 下发 conversation_id，
              // 此时将无法继续对话。建议后端在流中发送一次：
              // data: {"meta":{"conversation_id":"..."}}
              // （如需兜底，可在此追加一次非流式 /chat/start 仅获取ID，但会重复生成内容。）
            }
          } catch {
            // 流式不可用 → 回退到一次性
            const res = await fetch(api('/chat/start'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paipan: mingpan }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            if (!alive) return;

            const cid = String(data.conversation_id || '');
            if (cid) {
              sessionStorage.setItem('conversation_id', cid);
              setConversationId(cid);
            }

            const first = pickReply(data).trim();
            const initMsgs: Msg[] = [
              { role: 'assistant', content: normalizeMarkdown(first || '（后端未返回解读内容）') },
            ];
            setMsgs(initMsgs);
            if (cid) saveConversation(cid, initMsgs);
          }
        } catch (e: unknown) {
          if (!alive) return;
          setErr(e instanceof Error ? e.message : String(e));
        } finally {
          if (alive) setBooting(false);
        }
        return; // 处理完 URL 分支后返回
      }

      // ===== 无 URL 参数：恢复旧会话 =====
      const active = getActiveConversationId() || sessionStorage.getItem('conversation_id');
      if (active) {
        const cached = loadConversation(active);
        if (cached?.length) {
          if (!alive) return;
          setConversationId(active);
          setMsgs(cached);
          if (!cachedPaipan) {
            const p2 = loadPaipanLocal();
            if (p2) setPaipan(p2);
          }
          setBooting(false);
          return;
        }
      }

      // ===== 兼容老入口 =====
      const bootSaved = sessionStorage.getItem('bootstrap_reply');
      const cidSaved = sessionStorage.getItem('conversation_id');
      if (bootSaved?.trim()) {
        if (!alive) return;
        if (cidSaved) setConversationId(cidSaved);
        const initMsgs: Msg[] = [{ role: 'assistant', content: normalizeMarkdown(bootSaved) }];
        setMsgs(initMsgs);
        if (cidSaved) saveConversation(cidSaved, initMsgs);
        if (!cachedPaipan) {
          const p2 = loadPaipanLocal();
          if (p2) setPaipan(p2);
        }
        sessionStorage.removeItem('bootstrap_reply');
        setBooting(false);
        return;
      }

      // 没有任何上下文
      setErr('缺少排盘参数，请返回首页重新创建会话。');
      setBooting(false);
    })();

    return () => { alive = false; };
  }, []);

  // 持久化消息
  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs);
  }, [conversationId, msgs]);

  // ===== Helpers =====
  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !loading && !booting,
    [conversationId, input, loading, booting],
  );

  const sendOnce = async (content: string) => {
    const res = await fetch(api('/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, message: content }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return pickReply(data).trim();
  };

  const sendStream = async (content: string) => {
    if (!conversationId) throw new Error('缺少会话，请返回首页重新创建。');

    // 先插入占位的 assistant
    let assistantIndex = -1;
    setMsgs((prev) => {
      const next: Msg[] = [...prev, { role: 'assistant', content: '' }];
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
      // 优先 SSE
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content },
        append,
        (meta) => {
          const cid = String(meta?.conversation_id || '');
          if (cid) {
            sessionStorage.setItem('conversation_id', cid);
            setConversationId(cid);
          }
        },
      );

      // 归一化 Markdown
      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        next[assistantIndex] = { ...next[assistantIndex], content: normalizeMarkdown(next[assistantIndex].content) };
        return next;
      });
    } catch {
      // 降级为一次性
      const full = await sendOnce(content);
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
      setErr('缺少会话，请返回首页重新创建。');
      return;
    }
    const content = input.trim();
    if (!content) return;

    setErr(null);
    setMsgs((m) => [...m, { role: 'user', content }]);
    setInput('');
    setLoading(true);

    try {
      await sendStream(content);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    if (!conversationId) return;
    const lastAssistantIdx = [...msgs].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'assistant')?.i;
    if (lastAssistantIdx == null) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(api('/chat/regenerate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setLoading(false);
    }
  };

  const sendQuick = async (label: string, fullPrompt: string) => {
    if (!conversationId) {
      setErr('缺少会话，请返回首页重新创建。');
      return;
    }
    setErr(null);
    setMsgs((m) => [...m, { role: 'user', content: `${label}分析` }]);
    setLoading(true);
    try {
      await sendStream(fullPrompt);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      if (canSend) void send();
    }
  };

  // ===== UI =====
  return (
    <main className="min-h-screen bg-[#fef3c7] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <ChatHeader
          conversationId={conversationId}
          onBack={() => router.push('/')}
        />

        {paipan && (
          <PaipanCard
            paipan={paipan}
            WuxingBadge={WuxingBadge}
            WuxingBar={WuxingBar}
            getWuxing={getWuxing}
            colorClasses={colorClasses}
            guessPercent={(el: Wuxing) => guessElementPercent(el)}
          />
        )}

       

        <MessageList
          scrollRef={scrollRef}
          messages={msgs}
          Markdown={Markdown as any}
        />

        {(booting || loading) && (
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
          disabled={loading || booting || !conversationId}
          buttons={QUICK_BUTTONS}
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
        />
      </div>
    </main>
  );
}
