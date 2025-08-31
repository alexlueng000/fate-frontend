'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, Bar, DayunChip } from '../components/chat';
import Markdown from '../components/Markdown';

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

// ==== 从 URL 读取排盘参数（用于首次进入时计算命盘）====
function readPaipanParamsFromURL(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  const gender = sp.get('gender') || '';
  const calendar = sp.get('calendar') || 'gregorian';
  const birth_date = sp.get('birth_date') || '';
  const birth_time = sp.get('birth_time') || '12:00';
  const birthplace = sp.get('birthplace') || '';
  const use_true_solar = sp.get('use_true_solar') || 'true';
  const lat = sp.get('lat') || '0';
  const lng = sp.get('lng') || '0';
  const longitude = sp.get('longitude') || '0';
  if (!birth_date) return null;
  return { gender, calendar, birth_date, birth_time, birthplace, use_true_solar, lat, lng, longitude };
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

  // 初始化：只从 URL 取参数并计算命盘，再启动会话
  useEffect(() => {
    let alive = true;
    (async () => {
      setBooting(true);

      // 首页带来的首条回复
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

      try {
        const payload = readPaipanParamsFromURL();
        if (!payload) {
          if (alive) {
            setErr('缺少排盘参数，请返回首页重新创建会话。');
            setBooting(false);
          }
          return;
        }

        const calcRes = await fetch(api('/bazi/calc_paipan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!calcRes.ok) throw new Error(await calcRes.text());
        const calcData = await calcRes.json();

        const mingpan = calcData?.mingpan as Paipan | undefined;
        if (!mingpan) throw new Error('后端未返回命盘（mingpan）。');

        setPaipan(mingpan);

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
    <main className="min-h-screen bg-[#fef3c7] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-red-900">对话解读</h1>
          <div className="flex items-center gap-3 text-xs text-neutral-700">
            {conversationId ? <span>ID: {conversationId}</span> : <span>正在建立会话…</span>}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-full border border-red-200 bg-white/90 px-3 py-1 text-red-800 hover:bg-red-50 transition"
            >
              返回首页
            </button>
          </div>
        </div>

        {/* 命盘卡片 */}
        {paipan && (
          <div className="rounded-3xl border border-red-200 bg-white/90 p-6 space-y-6 shadow-sm">
            {/* 四柱 */}
            <div>
              <h4 className="text-sm font-semibold text-red-900">四柱</h4>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Pill label="年柱" value={paipan.four_pillars.year.join('')} />
                <Pill label="月柱" value={paipan.four_pillars.month.join('')} />
                <Pill label="日柱" value={paipan.four_pillars.day.join('')} />
                <Pill label="时柱" value={paipan.four_pillars.hour.join('')} />
              </div>
            </div>

            {/* 五行 */}
            <div>
              <h4 className="text-sm font-semibold text-red-900">五行概览</h4>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['木', '火', '土', '金', '水'] as const).map((el) => (
                  <Bar key={el} name={el} percent={guessElementPercent(el)} />
                ))}
              </div>
            </div>

            {/* 大运 */}
            <div>
              <h4 className="text-sm font-semibold text-red-900">大运</h4>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {paipan.dayun.map((d, i) => (
                  <DayunChip key={i} age={d.age} year={d.start_year} pillar={d.pillar.join('')} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading / 错误 */}
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

        {/* 聊天区 */}
        <div
          ref={scrollRef}
          className="h-[50vh] overflow-y-auto rounded-3xl border border-red-200 bg-white/90 p-4 space-y-3"
        >
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-red-600 text-white rounded-br-sm shadow-md shadow-red-600/25'
                    : 'bg-white text-neutral-900 border border-red-200 rounded-bl-sm'
                }`}
              >
                {m.role === 'assistant' ? <Markdown content={m.content} /> : m.content}
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
            className="h-20 flex-1 resize-none rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
            disabled={booting || !conversationId}
          />
          <button
            onClick={() => void send()}
            disabled={!canSend}
            title={!conversationId ? '正在建立会话，请稍候…' : undefined}
            className="h-20 w-28 rounded-2xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-600/20"
          >
            {loading ? '发送中…' : '发送'}
          </button>
        </div>
      </div>
    </main>
  );
}
