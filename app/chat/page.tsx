'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Msg = { role: 'user' | 'assistant'; content: string };
type FourPillars = { year: string[]; month: string[]; day: string[]; hour: string[] };
type DayunItem = { age: number; start_year: number; pillar: string[] };
type Paipan = { four_pillars: FourPillars; dayun: DayunItem[] };

const API = process.env.NEXT_PUBLIC_API_BASE;

// 更健壮地从任意结构里提取首条回复
function pickReply(d: unknown): string {
    if (!d || typeof d !== 'object') return '';
  
    const obj = d as Record<string, unknown>;
  
    if (typeof obj.reply === 'string') return obj.reply;
  
    if (
      typeof obj.data === 'object' &&
      obj.data !== null &&
      typeof (obj.data as Record<string, unknown>).reply === 'string'
    ) {
      return (obj.data as Record<string, unknown>).reply as string;
    }
  
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.content === 'string') return obj.content;
  
    return '';
  }

export default function ChatPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);  // 发送中的 loading
  const [booting, setBooting] = useState(false);  // 首次“正在解读中”
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // 进入页面：立刻显示 loading；优先用 bootstrap_reply，否则无条件调用 /chat/start
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!API) { setErr('缺少 NEXT_PUBLIC_API_BASE 环境变量'); return; }
      setBooting(true);

      // 1) 若首页已提前放了首条回复（bootstrap_reply），优先展示
      const bootSaved = sessionStorage.getItem('bootstrap_reply');
      const cidSaved  = sessionStorage.getItem('conversation_id');
      if (bootSaved && bootSaved.trim()) {
        if (!alive) return;
        if (cidSaved) setConversationId(cidSaved);
        setMsgs([{ role: 'assistant', content: bootSaved }]);
        sessionStorage.removeItem('bootstrap_reply');
        setBooting(false);
        return;
      }

      // 2) 否则，无条件用 paipan 创建新会话并获取首条解读
      const paipanRaw = sessionStorage.getItem('paipan');
      if (!paipanRaw) {
        if (alive) {
          setErr('缺少排盘数据，请返回首页重新创建会话。');
          setBooting(false);
        }
        return;
      }

      try {
        const paipan: Paipan = JSON.parse(paipanRaw);
        const res = await fetch(`/chat/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paipan }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (!alive) return;

        const cid = String(data.conversation_id || '');
        if (cid) {
          sessionStorage.setItem('conversation_id', cid);
          setConversationId(cid);
        }

        // ✅ 更宽松地提取后端返回的首条解读
        const first = pickReply(data).trim();
        setMsgs([{ role: 'assistant', content: first || '（后端未返回解读内容）' }]);
      } catch (e: unknown) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const canSend = useMemo(() => {
    return !!conversationId && !!input.trim() && !loading && !booting;
  }, [conversationId, input, loading, booting]);

  const send = async () => {
    if (!API) { setErr('缺少 NEXT_PUBLIC_API_BASE 环境变量'); return; }
    if (!conversationId) { setErr('缺少会话，请返回首页重新创建。'); return; }
    if (!input.trim()) return;

    setErr(null);
    const userMsg: Msg = { role: 'user', content: input.trim() };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, message: userMsg.content }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json();

      // 某些实现可能在此返回新的会话ID（轮换/续期）
      const cid = String(data.conversation_id || conversationId);
      if (cid && cid !== conversationId) {
        sessionStorage.setItem('conversation_id', cid);
        setConversationId(cid);
      }

      const reply = pickReply(data).trim();
      setMsgs((m) => [...m, { role: 'assistant', content: reply || '（后端未返回解读内容）' }]);
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

  return (
    <main className="min-h-screen bg-[#f6f1e8] p-6 sm:p-10">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-800">对话解读</h1>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            {conversationId ? <span>ID: {conversationId}</span> : <span>正在建立会话…</span>}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-stone-200 hover:bg-white"
            >
              返回首页
            </button>
          </div>
        </div>

        {/* 顶部 Loading */}
        {(booting || loading) && (
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 p-3 text-sm text-stone-700 ring-1 ring-stone-200">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
            {booting ? '正在解读中…' : '发送中…'}
          </div>
        )}

        {/* 错误 */}
        {err && (
          <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
            错误：{err}
          </div>
        )}

        {/* 对话区 */}
        <div
          ref={scrollRef}
          className="h-[58vh] overflow-y-auto rounded-3xl bg-white/90 p-4 shadow ring-1 ring-black/5"
        >
          {/* 首轮 skeleton */}
          {booting && msgs.length === 0 && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-600 ring-1 ring-stone-200">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
                正在生成首轮解读…
              </div>
            </div>
          )}

          {/* 历史消息 */}
          <div className="space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-50 text-stone-800 ring-1 ring-stone-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 输入区 */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="请输入你的问题，Shift+Enter 换行…"
            className="h-20 flex-1 resize-none rounded-2xl border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-900 disabled:opacity-50"
            disabled={booting || !conversationId}
          />
          <button
            onClick={() => void send()}
            disabled={!canSend}
            className="h-20 w-28 rounded-2xl bg-stone-900 text-sm text-white disabled:opacity-50"
          >
            {loading ? '发送中…' : '发送'}
          </button>
        </div>
      </div>
    </main>
  );
}
