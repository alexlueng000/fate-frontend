'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Markdown from '../components/Markdown';
import {
  Wuxing,
  WuxingBadge,
  WuxingBar,
  guessElementPercent,
  getWuxing,
  colorClasses,
} from '../components/WuXing';

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

// ==== 快捷按钮：显示文案 + 隐藏提示词 ====
const QUICK_BUTTONS: Array<{ label: string; prompt: string }> = [
  {
    label: '性格特征',
    prompt:
      '请基于当前命盘，输出“性格特征分析”。结构：1)核心气质（3-5条），2)优势与闪光点（结合五行强弱），3)可能盲区与建议（避免绝对化）。最后一行提醒：理性看待，重在行动与选择。',
  },
  {
    label: '人物画像',
    prompt:
      '请输出“人物画像”。结构：1)关键词（5-8个），2)日常行为风格（3-5条），3)沟通偏好（2-3条），4)压力来源与调节建议（2-3条）。要求简洁、实用、非宿命化。',
  },
  {
    label: '正缘人物画像',
    prompt:
      '请输出“正缘人物画像”。结构：1)大致性格特征（4-6条），2)可能的职业/兴趣标签（3-5个），3)相处注意点（3条），4)提升吸引力建议（3条）。保持理性与尊重。',
  },
  {
    label: '事业建议',
    prompt:
      '请输出“事业建议”。结构：1)适配方向（3-5类并说明原因），2)当前阶段发力点（2-3条），3)避坑提醒（2-3条），4)未来一年可执行清单（4-6条，动词开头）。',
  },
  {
    label: '财运分析',
    prompt:
      '请输出“财运分析”。结构：1)财务优势与风险点（各2-3条），2)适合的增收路径（3-5条），3)管理建议（预算/储蓄/投资的简要框架）。不得承诺收益或具体时间点。',
  },
  {
    label: '健康分析',
    prompt:
      '请输出“健康分析”（生活建议，非医疗意见）。结构：1)日常关注点（2-3条），2)作息建议（3-5条），3)运动与饮食提示（各2-3条）。避免医学诊断与疗效承诺。',
  },
  {
    label: '正缘应期',
    prompt:
      '请输出“正缘相关的有利时段”——给出相对性阶段提醒。结构：1)倾向更顺的阶段（1-3段，描述特征而非具体日期），2)建议的准备与行动（3-5条）。避免具体时间与保证性表述。',
  },
];

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

// ===== 持久化工具 =====
const LS_ACTIVE = 'chat:active';
const LS_CONV_PREFIX = 'chat:conv:'; // + conversation_id
const LS_LAST_PAIPAN = 'chat:last_paipan';

function saveConversation(conversationId: string, messages: Msg[]) {
  try {
    localStorage.setItem(`${LS_CONV_PREFIX}${conversationId}`, JSON.stringify(messages));
    localStorage.setItem(LS_ACTIVE, conversationId);
  } catch {}
}
function loadConversation(conversationId: string): Msg[] | null {
  try {
    const raw = localStorage.getItem(`${LS_CONV_PREFIX}${conversationId}`);
    return raw ? (JSON.parse(raw) as Msg[]) : null;
  } catch {
    return null;
  }
}
function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE);
  } catch {
    return null;
  }
}
function savePaipanLocal(p: Paipan) {
  try {
    localStorage.setItem(LS_LAST_PAIPAN, JSON.stringify(p));
  } catch {}
}
function loadPaipanLocal(): Paipan | null {
  try {
    const raw = localStorage.getItem(LS_LAST_PAIPAN);
    return raw ? (JSON.parse(raw) as Paipan) : null;
  } catch {
    return null;
  }
}

/** 轻量 Markdown 归一化：修复 # 后缺空格、标题前缺空行、中文序号、冒号后接列表等 */
function normalizeMarkdown(input: string): string {
  let s = input;

  // 1) 标题后必须有空格：###财运 -> ### 财运
  s = s.replace(/^(\#{1,6})([^\s#])/gm, (_m, p1, p2) => `${p1} ${p2}`);

  // 2) 中文小节标题也空格：####一、 -> #### 一、
  s = s.replace(/^(\#{2,6})\s*([一二三四五六七八九十]+、)/gm, (_m, p1, p2) => `${p1} ${p2}`);

  // 3) 在标题前补一行空行（避免粘在上一段尾部）
  s = s.replace(/([^\n])\n(#{1,6}\s)/g, (_m, p1, p2) => `${p1}\n\n${p2}`);

  // 4) 冒号后紧跟列表项时，自动换行： "：- " / "：1. " -> "：\n- " / "：\n1. "
  s = s.replace(/：\s*(?=(?:-|\d+\.)\s)/g, '：\n');

  // 5) 保证列表项有空格："-项目" -> "- 项目"
  s = s.replace(/^(\s*[-•])([^\s-])/gm, (_m, p1, p2) => `${p1} ${p2}`);

  // 6) 折叠多余空行为最多两个
  s = s.replace(/\n{3,}/g, '\n\n');

  // 7) 结尾修剪空白
  s = s.trim();

  return s;
}

// ===== SSE 工具（优先流式，失败回退）=====
async function trySSE(
  url: string,
  body: any,
  onDelta: (text: string) => void,
  onMeta?: (meta: any) => void,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  });

  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('text/event-stream') || !res.body) {
    throw new Error(`SSE not available (status ${res.status}, ct=${ct})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const lines = event.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        // 尝试解析 meta JSON
        if (data.startsWith('{')) {
          try {
            const obj = JSON.parse(data);
            if (obj && obj.meta && onMeta) {
              onMeta(obj.meta);
              continue;
            }
          } catch {
            // 非 JSON，继续当增量文本处理
          }
        }
        onDelta(data);
      }
    }
  }
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

  // 初始化：若 URL 携带排盘参数 → 强制按参数新建会话；否则从本地恢复
  useEffect(() => {
    let alive = true;
    (async () => {
      setBooting(true);

      // 持久化的 paipan 优先展示（避免刷新丢头部）
      const cachedPaipan = loadPaipanLocal();
      if (cachedPaipan) setPaipan(cachedPaipan);

      const urlPayload = readPaipanParamsFromURL();
      if (urlPayload) {
        try {
          sessionStorage.removeItem('conversation_id');

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

          // start 仍一次性返回（你已说明前端首轮不走流）
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
          const initMsgs: Msg[] = [{ role: 'assistant', content: normalizeMarkdown(first || '（后端未返回解读内容）') }];
          setMsgs(initMsgs);
          if (cid) saveConversation(cid, initMsgs);
        } catch (e: unknown) {
          if (!alive) return;
          setErr(e instanceof Error ? e.message : String(e));
        } finally {
          if (alive) setBooting(false);
        }
        return;
      }

      // === 没有 URL 参数：再尝试恢复旧会话 ===
      const active = getActiveConversationId() || sessionStorage.getItem('conversation_id');
      if (active) {
        const cached = loadConversation(active);
        if (cached && cached.length > 0) {
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

      // 兼容老路径
      const bootSaved = sessionStorage.getItem('bootstrap_reply');
      const cidSaved = sessionStorage.getItem('conversation_id');
      if (bootSaved && bootSaved.trim()) {
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

      if (alive) {
        setErr('缺少排盘参数，请返回首页重新创建会话。');
        setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 持久化：会话或消息变化时保存
  useEffect(() => {
    if (conversationId) {
      saveConversation(conversationId, msgs);
    }
  }, [conversationId, msgs]);

  const canSend = useMemo(() => {
    return !!conversationId && !!input.trim() && !loading && !booting;
  }, [conversationId, input, loading, booting]);

  // ===== 基础发送（非流式）=====
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

  // ===== 优先流式发送，失败回退到一次性 =====
  const sendStream = async (content: string) => {
    if (!conversationId) throw new Error('缺少会话，请返回首页重新创建。');

    // 1) 先创建一个空的 assistant 占位
    let assistantIndex = -1;
    setMsgs((prev) => {
      const next = [...prev, { role: 'assistant', content: '' }];
      assistantIndex = next.length - 1;
      return next;
    });

    const append = (delta: string) => {
      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        const cur = next[assistantIndex];
        next[assistantIndex] = { ...cur, content: cur.content + delta };
        return next;
      });
    };

    try {
      // 优先尝试 SSE
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content },
        append,
        // meta 事件：更新会话 ID（更稳妥）
        (meta) => {
          const cid = String(meta?.conversation_id || '');
          if (cid) {
            sessionStorage.setItem('conversation_id', cid);
            setConversationId(cid);
          }
        },
      );

      // 流结束 → 归一化 Markdown
      setMsgs((prev) => {
        if (assistantIndex < 0 || assistantIndex >= prev.length) return prev;
        const next = [...prev];
        const cur = next[assistantIndex];
        next[assistantIndex] = { ...cur, content: normalizeMarkdown(cur.content) };
        return next;
      });
    } catch {
      // 如果 SSE 不可用，降级为一次性回复，并做 Markdown 归一化
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

  // 🔁 Regenerate：替换最后一条 assistant（一次性+归一化）
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

  // 发送隐藏 prompt（快捷按钮）：优先流式
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

  return (
    <main className="min-h-screen bg-[#fef3c7] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-red-900">对话解读</h1>
          <div className="flex items-center gap-2 text-xs text-neutral-700">
            {conversationId ? (
              <span className="px-2 py-1 rounded bg-white/70 border border-red-200">ID: {conversationId}</span>
            ) : (
              <span>正在建立会话…</span>
            )}
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
          <div className="rounded-3xl border border-red-200 bg-white p-6 space-y-6 shadow-sm">
            {/* 四柱表格 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-red-900">四柱</h4>
              <div className="grid grid-cols-5 text-center text-sm font-semibold text-neutral-900">
                <div className="text-left text-neutral-700">层级</div>
                <div>年</div>
                <div>月</div>
                <div>日</div>
                <div>时</div>
              </div>
              <div className="grid grid-cols-5 gap-y-2 rounded-2xl border border-red-200 p-3">
                <div className="flex items-center text-sm font-medium text-neutral-700">天干</div>
                <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.year?.[0] || ''} /></div>
                <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.month?.[0] || ''} /></div>
                <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.day?.[0] || ''} /></div>
                <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.hour?.[0] || ''} /></div>

                <div className="flex items-center text-sm font-medium text-neutral-700">地支</div>
                <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.year?.[1] || ''} /></div>
                <div className="flex items中心 justify-center"><WuxingBadge char={paipan.four_pillars.month?.[1] || ''} /></div>
                <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.day?.[1] || ''} /></div>
                <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.hour?.[1] || ''} /></div>
              </div>
              <p className="text-xs text-neutral-600">
                颜色对应五行：木-绿、火-红、土-棕黄、金-金黄、水-蓝。仅供理性参考，关键在行动与选择。
              </p>
            </div>

            {/* 五行概览 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-red-900">五行概览</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['木', '火', '土', '金', '水'] as Wuxing[]).map((el) => (
                  <WuxingBar key={el} name={el} percent={guessElementPercent(el)} />
                ))}
              </div>
            </div>

            {/* 大运 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-red-900">大运</h4>
              <div className="mt-1 flex gap-3 overflow-x-auto pb-2">
                {paipan.dayun.map((d, i) => {
                  const pillar = d.pillar?.join('') || '';
                  const gan = pillar?.[0] || '';
                  const el = getWuxing(gan) || '火';
                  return (
                    <div
                      key={i}
                      className={`shrink-0 rounded-2xl border ${colorClasses(el, 'border')} bg-white px-4 py-3 text-xs text-neutral-900 min-w-[180px] shadow-sm`}
                    >
                      <div>起运年龄：<span className={`${colorClasses(el, 'text')} font-semibold`}>{d.age}</span></div>
                      <div className="mt-0.5">起运年份：<span className={`${colorClasses(el, 'text')} font-semibold`}>{d.start_year}</span></div>
                      <div className="mt-1">大运：<span className={`font-bold ${colorClasses(el, 'text')}`}>{pillar || '—'}</span></div>
                    </div>
                  );
                })}
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
          className="h-[46vh] overflow-y-auto rounded-3xl border border-red-200 bg-white/90 p-4 space-y-3"
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

        {/* 快捷按钮（位于输出区与输入区之间） */}
        <div className="rounded-3xl border border-red-200 bg-white/90 p-4 sm:p-6">
          <div className="mb-3 text-sm font-bold text-red-900">快捷分析</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_BUTTONS.map((b) => (
              <button
                key={b.label}
                type="button"
                disabled={loading || booting || !conversationId}
                onClick={() => void sendQuick(b.label, b.prompt)}
                className="h-12 sm:h-14 rounded-2xl border border-red-200 bg-white text-red-800 hover:bg-red-50 transition text-sm font-medium disabled:opacity-50"
                title={`快速生成：${b.label}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* 输入区（Regenerate 在发送按钮右侧） */}
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="请输入你的问题，Shift+Enter 换行…"
            className="h-24 flex-1 resize-none rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
            disabled={booting || !conversationId}
          />

          <div className="flex gap-2">
            <button
              onClick={() => void send()}
              disabled={!canSend}
              title={!conversationId ? '正在建立会话，请稍候…' : undefined}
              className="h-24 w-28 rounded-2xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {loading ? '发送中…' : '发送'}
            </button>

            <button
              onClick={() => void regenerate()}
              disabled={loading || booting || !conversationId}
              className="h-24 w-28 rounded-2xl border border-red-200 bg-white text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
              title="重新生成上一条解读"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
