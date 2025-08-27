'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Msg = { role: 'user' | 'assistant'; content: string };
type FourPillars = { year: string[]; month: string[]; day: string[]; hour: string[] };
type DayunItem = { age: number; start_year: number; pillar: string[] };
type Paipan = { four_pillars: FourPillars; dayun: DayunItem[] };

// ==== API 基址 ====
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
const api = (path: string) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`);

// ==== 统一提取回复文本 ====
function pickReply(d: unknown): string {
  if (!d || typeof d !== 'object') return '';
  const obj = d as Record<string, unknown>;
  if (typeof obj.reply === 'string') return obj.reply;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.content === 'string') return obj.content;
  if (obj.data && typeof (obj.data as any).reply === 'string') return (obj.data as any).reply;
  return '';
}

// ==== 五行占位比例（真实数据后端提供时替换）====
function guessElementPercent(el: string): number {
  const base: Record<string, number> = { 木: 40, 火: 55, 土: 35, 金: 30, 水: 45 };
  return base[el] ?? 40;
}

export default function ChatPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 命盘信息
  const [paipan, setPaipan] = useState<Paipan | null>(null);

  // 自动滚动
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // 初始化：取 paipan / 启动会话
  useEffect(() => {
    let alive = true;
    (async () => {
      setBooting(true);

      const bootSaved = sessionStorage.getItem('bootstrap_reply');
      const cidSaved = sessionStorage.getItem('conversation_id');
      if (bootSaved && bootSaved.trim()) {
        if (!alive) return;
        if (cidSaved) setConversationId(cidSaved);
        setMsgs([{ role: 'assistant', content: bootSaved }]);
        sessionStorage.removeItem('bootstrap_reply');
        setBooting(false);
        return;
      }

      const paipanRaw = sessionStorage.getItem('paipan');
      if (!paipanRaw) {
        if (alive) {
          setErr('缺少排盘数据，请返回首页重新创建会话。');
          setBooting(false);
        }
        return;
      }

      try {
        const parsed: Paipan = JSON.parse(paipanRaw);
        setPaipan(parsed);

        const res = await fetch(api('/chat/start'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paipan: parsed }),
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
        setMsgs([{ role: 'assistant', content: first || '（后端未返回解读内容）' }]);
      } catch (e: unknown) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const canSend = useMemo(() => {
    return !!conversationId && !!input.trim() && !loading && !booting;
  }, [conversationId, input, loading, booting]);

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
      const res = await fetch(api('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, message: content }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

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
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-50 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">对话解读</h1>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            {conversationId ? <span>ID: {conversationId}</span> : <span>正在建立会话…</span>}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20"
            >
              返回首页
            </button>
          </div>
        </div>

        {/* 命盘卡片 */}
        {paipan && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-6">
            {/* 四柱 */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-200">四柱</h4>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Pill label="年柱" value={paipan.four_pillars.year.join('')} />
                <Pill label="月柱" value={paipan.four_pillars.month.join('')} />
                <Pill label="日柱" value={paipan.four_pillars.day.join('')} />
                <Pill label="时柱" value={paipan.four_pillars.hour.join('')} />
              </div>
            </div>

            {/* 五行 */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-200">五行概览</h4>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['木', '火', '土', '金', '水'] as const).map((el) => (
                  <Bar key={el} name={el} percent={guessElementPercent(el)} />
                ))}
              </div>
            </div>

            {/* 大运 */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-200">大运</h4>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {paipan.dayun.map((d, i) => (
                  <DayunChip
                    key={i}
                    age={d.age}
                    year={d.start_year}
                    pillar={d.pillar.join('')}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading / 错误 */}
        {(booting || loading) && (
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-sm text-neutral-200">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white" />
            {booting ? '正在解读中…' : '发送中…'}
          </div>
        )}
        {err && (
          <div className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-300 border border-red-500/30">
            错误：{err}
          </div>
        )}

        {/* 聊天区 */}
        <div
          ref={scrollRef}
          className="h-[50vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3"
        >
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                    : 'bg-white/10 text-neutral-100 border border-white/10'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {/* 输入区 */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="请输入你的问题，Shift+Enter 换行…"
            className="h-20 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={booting || !conversationId}
          />
          <button
            onClick={() => void send()}
            disabled={!canSend}
            className="h-20 w-28 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? '发送中…' : '发送'}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ===== 子组件 ===== */
function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] text-neutral-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value || '—'}</div>
    </div>
  );
}

function Bar({ name, percent }: { name: string; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-neutral-300">
        <span>{name}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function DayunChip({ age, year, pillar }: { age: number; year: number; pillar: string }) {
  return (
    <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-200">
      <div>起运年龄：<span className="text-white font-medium">{age}</span></div>
      <div>起运年份：<span className="text-white font-medium">{year}</span></div>
      <div className="mt-1">大运：<span className="font-semibold">{pillar || '—'}</span></div>
    </div>
  );
}
