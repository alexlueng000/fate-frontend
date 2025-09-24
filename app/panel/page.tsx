'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Markdown from '@/app/components/Markdown';
import {
  WuxingBadge, WuxingBar, getWuxing, colorClasses
} from '@/app/components/WuXing';
import { ChatHeader } from '@/app/components/chat/ChatHeader';
import { PaipanCard } from '@/app/components/chat/PaipanCard';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';
import { BirthDateTimeFields } from '@/app/components/chat/BirthDateTime';

import {
  Msg, Paipan, QUICK_BUTTONS,
} from '@/app/lib/chat/types';
import { api, pickReply } from '@/app/lib/chat/api';
import { trySSE } from '@/app/lib/chat/sse';
import {
  saveConversation, loadConversation, getActiveConversationId,
  savePaipanLocal, loadPaipanLocal,
} from '@/app/lib/chat/storage';

import { SYSTEM_INTRO } from '@/app/lib/chat/constants';
import { useUser, fetchMe } from '@/app/lib/auth';

import { normalizeMarkdown } from '@/app/lib/chat/types';




export default function PanelPage() {
  const router = useRouter();

  // 组件内：必要的 ref/state（若你已存在就不要重复声明）
const aiIndexRef = useRef<number | null>(null);
const streamingLockRef = useRef(false);
const lastFullRef = useRef(''); // 防重复 setState（可选）


  // ===== 用户信息 =====
  const { user: me, setUser } = useUser();

  // ===== 会话/消息 =====
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ===== 命盘 =====
  const [paipan, setPaipan] = useState<Paipan | null>(null);

  // ===== 表单：快速排盘 =====
  const [birthPlace, setBirthPlace] = useState('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [calendarType, setCalendarType] = useState<'gregorian' | 'lunar'>('gregorian'); // 默认阳历
  const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD
  const [birthTime, setBirthTime] = useState(''); // HH:MM
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcErr, setCalcErr] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

   // ====== 快捷按钮（从 DB 取，失败回退到本地 7 条）=====
  type QuickBtn = { label: string; prompt: string; order?: number; active?: boolean };
  const [qbLoading, setQbLoading] = useState(true);
  const [quickButtons, setQuickButtons] = useState<Array<{ label: string; prompt: string }>>(QUICK_BUTTONS);


  function parseValue(v: any): { items?: QuickBtn[]; maxCount?: number } {
    if (!v) return {};
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return {}; }
    }
    return v;
  }

  async function loadQuickButtonsFromAdmin() {
    setQbLoading(true);
    try {
      const resp = await fetch(api('/admin/config?key=quick_buttons'), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }).catch((err: unknown) => {
        throw new Error(`网络错误：${(err as Error)?.message || '可能是 CORS/域名/协议问题'}`);
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`加载失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
      }
      const data = await resp.json().catch(() => null);
      if (!data) throw new Error('服务器返回了无效的 JSON');

      const parsed = parseValue(data.value_json);
      const list: QuickBtn[] = Array.isArray(parsed.items) ? parsed.items : [];
      const filtered = list.filter(it => it && (it.active !== false) && it.label && it.prompt);
      const sorted = filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const maxCount = Math.max(1, parsed.maxCount ?? 12);
      const sliced = sorted.slice(0, maxCount);
      if (sliced.length > 0) {
        setQuickButtons(sliced.map(({ label, prompt }) => ({ label, prompt })));
      } else {
        // 兜底
        setQuickButtons(QUICK_BUTTONS);
      }
    } catch {
      // 兜底
      setQuickButtons(QUICK_BUTTONS);
    } finally {
      setQbLoading(false);
    }
  }

  useEffect(() => {
    loadQuickButtonsFromAdmin();
  }, []);

         // 放在组件里任意位置（或 utils）
  function hasConversationId(x: unknown): x is { conversation_id: string } {
    return typeof x === 'object'
      && x !== null
      && 'conversation_id' in x
      && typeof (x as { conversation_id: string }).conversation_id === 'string';
  }

  // 类型守卫：是普通对象（非 null）
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

  // 从一个对象里读取会话 id（支持两种命名）
  const readCid = (obj: Record<string, unknown>): string | null => {
    const id1 = obj['conversation_id'];
    if (typeof id1 === 'string') return id1;

    const id2 = obj['conversationId'];
    if (typeof id2 === 'string') return id2;

    return null;
  };


  // 放在组件文件里（或 util）
  /** 从多种形状的 meta 中提取 conversation_id（无则返回空字符串） */
  function pickCid(meta: unknown): string {
    // 支持字符串 JSON
    if (typeof meta === 'string') {
      try { return pickCid(JSON.parse(meta)); } catch { return ''; }
    }

    if (!isRecord(meta)) return '';

    // 1) 顶层
    const top = readCid(meta);
    if (top) return top;

    // 2) meta 内层
    if ('meta' in meta) {
      const inner = (meta as Record<'meta', unknown>).meta;
      if (isRecord(inner)) {
        const v = readCid(inner);
        if (v) return v;
      }
    }

    // 3) data 内层（有些后端用 data 包一层）
    if ('data' in meta) {
      const inner = (meta as Record<'data', unknown>).data;
      if (isRecord(inner)) {
        const v = readCid(inner);
        if (v) return v;
      }
    }

    return '';
  }



  // ===== 滚动到底 =====
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // ===== 登录校验 & 恢复最近一次会话 =====
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!me) {
        const fetched = await fetchMe();
        if (!fetched) {
          router.replace('/login?redirect=/panel');
          return;
        }
        setUser(fetched);
      }

      const active = getActiveConversationId() || sessionStorage.getItem('conversation_id');
      const cachedPaipan = loadPaipanLocal();
      if (cachedPaipan) setPaipan(cachedPaipan);

      if (active) {
        const cached = loadConversation(active);
        if (cached?.length) {
          if (!alive) return;
          setConversationId(active);
          setMsgs(cached);
        }
      }
    })();
    return () => { alive = false; };
  }, [me, router, setUser]);

  // ===== 消息持久化 =====
  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs);
  }, [conversationId, msgs]);

  // ===== 能否发送 =====
  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !loading && !booting,
    [conversationId, input, loading, booting],
  );

  // ===== 一次性请求 =====
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

  // ===== SSE 流式发送 =====
  
  const sendStream = async (content: string) => {
    if (!conversationId) throw new Error('缺少会话，请先完成排盘并开启解读。');

    // ✅ 防止首条/首次因为 StrictMode 或双击而重复触发
    if (streamingLockRef.current) {
      console.debug('[stream] blocked: already streaming');
      return;
    }
    streamingLockRef.current = true;

    // 1) 插入占位 assistant（标记 streaming）
    setMsgs(prev => {
      const next: Msg[] = [...prev, { role: 'assistant', content: '', streaming: true }];
      aiIndexRef.current = next.length - 1;
      return next;
    });

    // 2) 替换：只吃“全文”，避免 +=
    const replace = (fullText: string) => {
      if (fullText === lastFullRef.current) return; // 去抖：相同内容不刷
      lastFullRef.current = fullText;

      setMsgs(prev => {
        const i = aiIndexRef.current;
        if (i == null || i < 0 || i >= prev.length) return prev;
        const next = [...prev];
        next[i] = { ...next[i], content: fullText };
        return next;
      });
    };

 
    try {
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content },
        replace, // ✅ 每次都是“整段最新文本”
        (meta) => {                        // 注意：这里参数类型是 unknown（由 trySSE 决定）
          const cid = hasConversationId(meta) ? meta.conversation_id : '';
          if (cid) {
            sessionStorage.setItem('conversation_id', cid);
            setConversationId(cid);
          }
        }
      );

      // 3) 结束后取消 streaming
      setMsgs(prev => {
        const i = aiIndexRef.current;
        if (i == null || i < 0 || i >= prev.length) return prev;
        const next = [...prev];
        next[i] = { ...next[i], streaming: false };
        return next;
      });
    } catch (e) {
      console.warn('[stream] SSE failed, fallback once:', e);
      // 4) 降级：一次性请求并做 normalize
      const full = await sendOnce(content);
      setMsgs(prev => {
        const i = aiIndexRef.current;
        if (i == null || i < 0 || i >= prev.length) return prev;
        const next = [...prev];
        next[i] = {
          role: 'assistant',
          streaming: false,
          content: normalizeMarkdown(full || '（后端未返回解读内容）'),
        };
        return next;
      });
    } finally {
      // ✅ 确保释放锁
      streamingLockRef.current = false;
      lastFullRef.current = ''; // 重置去抖缓存，避免影响下一轮
    }
  };

  // ===== 基本交互 =====
  const send = async () => {
    if (!conversationId) {
      setErr('缺少会话，请先完成排盘并开启解读。');
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

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      if (canSend) void send();
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

  const clearChat = async () => {
    if (!conversationId) return;
  
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(api('/chat/clear'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      if (!res.ok) throw new Error(await res.text());
  
      const data = await res.json().catch(() => null);
      if (!data || data.ok !== true) {
        throw new Error(data?.error || '清空失败（服务器未返回 ok:true）');
      }
  
      // 1) 清空页面消息
      setMsgs([]);
  
      // 2) 同步清空本地存档（如果你有本地持久化）
      try {
        saveConversation(conversationId, []);
      } catch {
        /* 忽略本地存档异常 */
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const sendQuick = async (label: string, fullPrompt: string) => {
    if (!conversationId) {
      setErr('缺少会话，请先完成排盘并开启解读。');
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

  // ===== 表单：排盘 + 启动解读 =====
  const handleCalcPaipan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcErr(null);
  
    if (!birthDate || !birthTime) {
      setCalcErr('请完整选择出生日期与时间');
      return;
    }
  
    setCalcLoading(true);
    setBooting(true);
    setErr(null);
  
    try {
      // 1) 计算命盘
      const body = {
        gender,
        calendar: calendarType,  // 'gregorian' | 'lunar'
        birth_date: birthDate,   // 'YYYY-MM-DD'
        birth_time: birthTime,   // 'HH:MM'
        birthplace: birthPlace,
      };
  
      const calcRes = await fetch(api('/bazi/calc_paipan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!calcRes.ok) throw new Error(await calcRes.text());
      const calcData = await calcRes.json();
      const mingpan = calcData?.mingpan as Paipan | undefined;
      if (!mingpan) throw new Error('后端未返回命盘（mingpan）。');
  
      setPaipan(mingpan);
      savePaipanLocal(mingpan);
  
      // 2) 清理旧会话 & 插入开场白 + 流式占位
      sessionStorage.removeItem('conversation_id');
      setConversationId(null);
  
      const assistantIndex = 1;
      setMsgs([
        { role: 'assistant', content: SYSTEM_INTRO, meta: { kind: 'intro' } },
        { role: 'assistant', content: '', streaming: true },
      ]);
  
      // 3) 首条流式解读（/chat/start）
      let cidLocal = '';
      let finalTextLocal = '';
  
      try {
        await trySSE(
          api('/chat/start'),
          { paipan: mingpan },
          // onDelta：始终“替换整段”
          (full) => {
            finalTextLocal = full;
            setMsgs((prev) => {
              const next = [...prev];
              if (assistantIndex >= 0 && assistantIndex < next.length) {
                next[assistantIndex] = { ...next[assistantIndex], content: full };
              }
              return next;
            });
          },
          // onMeta：宽松提取会话 id，首次就保存
          (metaAny) => {
            const cid = pickCid(metaAny);
            if (cid) {
              cidLocal = cid;
              sessionStorage.setItem('conversation_id', cid);
              setConversationId(cid);
            }
          }
        );
      } catch (err) {
        // 4) 流式失败 → 一次性兜底
        const res = await fetch(api('/chat/start'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paipan: mingpan }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
  
        const cid = String(data?.conversation_id || '');
        if (cid) {
          cidLocal = cid;
          sessionStorage.setItem('conversation_id', cid);
          setConversationId(cid);
        }
  
        const firstText = normalizeMarkdown(
          (data?.text || data?.content || '').trim() || '（后端未返回解读内容）'
        );
        finalTextLocal = firstText;
        setMsgs((prev) => {
          const next = [...prev];
          if (assistantIndex >= 0 && assistantIndex < next.length) {
            next[assistantIndex] = { role: 'assistant', streaming: false, content: firstText };
          }
          return next;
        });
      }
  
      // 5) 收尾：去掉 streaming
      setMsgs((prev) => {
        const next = [...prev];
        if (assistantIndex >= 0 && assistantIndex < next.length) {
          next[assistantIndex] = { ...next[assistantIndex], streaming: false };
        }
        return next;
      });
  
      // 6)（可选）持久化到你的对话存档
      if (cidLocal && typeof saveConversation === 'function') {
        try {
          saveConversation(cidLocal, [
            { role: 'assistant', content: SYSTEM_INTRO, meta: { kind: 'intro' } },
            { role: 'assistant', content: finalTextLocal || '' },
          ]);
        } catch {
          /* 忽略存档异常 */
        }
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCalcLoading(false);
      setBooting(false);
    }
  };

  const canUseQuick = !qbLoading && !loading && !booting && !!conversationId;
  
  return (
    <main className="min-h-screen bg-[#fff7e8] text-neutral-800 pt-20 sm:pt-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-10 space-y-6">


        {/* ===== 仅这两块左右并排 ===== */}
        <div className="overflow-x-auto">
          {/* 始终两列：左 420px，右自适应；小屏可横向滚动 */}
          <div className="grid grid-cols-[420px_minmax(0,1fr)] gap-6 min-w-[920px]">
            {/* 左：快速排盘表单 */}
            <section className="rounded-2xl border border-[#f0d9a6] bg-white/90 p-4 sm:p-6">
              <h2 className="text-base font-semibold text-[#a83232]">快速排盘</h2>

              <form onSubmit={handleCalcPaipan} className="mt-4 grid grid-cols-1 gap-4">
                {/* 性别 + 历法（并排） */}
                <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 性别 */}
                  <div>
                    <span className="mb-1 block text-sm text-neutral-700">性别</span>
                    <div className="flex gap-2">
                      {(['男', '女'] as const).map((g) => (
                        <label
                          key={g}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition
                            ${gender === g ? 'border-red-400 bg-red-50 text-red-800'
                                          : 'border-[#f0d9a6] bg-white/70 text-neutral-700 hover:bg-red-50/60'}`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={gender === g}
                            onChange={() => setGender(g)}
                            className="accent-red-600"
                          />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 历法 */}
                  <div>
                    <span className="mb-1 block text-sm text-neutral-700">历法</span>
                    <div className="flex gap-2">
                      {(['阳历', '农历'] as const).map((c) => {
                        const value = c === '阳历' ? 'gregorian' : 'lunar';
                        return (
                          <label
                            key={c}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition
                              ${calendarType === value ? 'border-red-400 bg-red-50 text-red-800'
                                                      : 'border-[#f0d9a6] bg-white/70 text-neutral-700 hover:bg-red-50/60'}`}
                          >
                            <input
                              type="radio"
                              name="calendar"
                              value={value}
                              checked={calendarType === value}
                              onChange={() => setCalendarType(value)}
                              className="accent-red-600"
                            />
                            {c}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 日期/时间/地点 */}
                <BirthDateTimeFields
                  birthDate={birthDate}
                  setBirthDate={setBirthDate}
                  birthTime={birthTime}
                  setBirthTime={setBirthTime}
                />
                <div>
                  <label className="mb-1 block text-sm text-neutral-700">出生地点</label>
                  <input
                    className="w-full rounded-xl border border-[#f0d9a6] bg-[#fff7ed] px-3 py-2 outline-none focus:ring-2 focus:ring-red-400"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="如：深圳"
                  />
                </div>

                {/* 提交 */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={calcLoading}
                    className="rounded-2xl bg-[#a83232] px-4 py-2 font-medium text-[#fff7e8] hover:bg-[#8c2b2b] disabled:opacity-60"
                  >
                    {calcLoading ? '排盘中…' : '生成命盘并开始解读'}
                  </button>
                  {calcErr && <div className="text-xs text-red-700">{calcErr}</div>}
                </div>
              </form>
            </section>

            {/* 右：命盘结果 */}
            <section className="rounded-2xl border border-[#f0d9a6] bg-white/90 p-0">
              {paipan ? (
                <PaipanCard
                  paipan={paipan}
                  WuxingBadge={WuxingBadge}
                  WuxingBar={WuxingBar}
                  getWuxing={getWuxing}
                  colorClasses={colorClasses}
                />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center p-8 text-center">
                  <div>
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#fde7d9] text-[#a83232]">🔮</div>
                    <div className="text-base font-medium">请在左侧填写信息并生成命盘</div>
                    <div className="mt-1 text-sm text-neutral-500">生成后，这里将展示四柱、大运与五行分布</div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ===== 快捷方式（小按钮） + 消息区 ===== */}
        <section className="space-y-4">
      
          {/* 消息列表 */}
          <MessageList scrollRef={scrollRef} messages={msgs} Markdown={Markdown} />

          {/* 状态 & 错误 */}
          {(booting || loading) && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#f0d9a6] bg-white/90 p-3 text-sm text-neutral-800">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
              {booting ? '正在解读中…' : '发送中…'}
            </div>
          )}
          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              错误：{err}
            </div>
          )}

          {/* 小号快捷按钮（从 DB 加载） */}
          <QuickActions
            disabled={!canUseQuick}
            buttons={quickButtons}
            onClick={sendQuick}
          />

          {/* 输入区 */}
          <InputArea
            value={input}
            onChange={setInput}
            onKeyDown={onKeyDown}
            canSend={canSend}
            sending={loading}
            disabled={booting || !conversationId}
            onSend={send}
            onRegenerate={regenerate}
            onStop={() => {/* 如果你有中断流式的逻辑，这里触发 */}}

            // 新增：
            onClear={clearChat}
            confirmClear={true}
          />
        </section>
      </div>
    </main>
  );
}
