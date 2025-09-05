'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Markdown from '@/app/components/Markdown';
import {
  Wuxing, WuxingBadge, WuxingBar, getWuxing, colorClasses, guessElementPercent
} from '@/app/components/WuXing';
import { ChatHeader } from '@/app/components/chat/ChatHeader';
import { PaipanCard } from '@/app/components/chat/PaipanCard';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';

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
import { currentUser, fetchMe, type User } from '@/app/lib/auth';

import { normalizeMarkdown } from '@/app/lib/chat/types';

export default function PanelPage() {
  const router = useRouter();

  const aiIndexRef = useRef<number | null>(null);

  // ===== 用户信息 =====
  const [me, setMe] = useState<User | null>(null);

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

  // ===== 滚动到底 =====
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // ===== 登录校验 & 恢复最近一次会话 =====
  useEffect(() => {
    let alive = true;
    (async () => {
      const u = currentUser();
      if (u) {
        setMe(u);
      } else {
        const fetched = await fetchMe();
        if (!fetched) {
          router.replace('/login?redirect=/panel');
          return;
        }
        setMe(fetched);
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
  }, [router]);

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
  
    // 1) 插入占位 assistant（标记 streaming 以便 UI 显示骨架/光标等）
    setMsgs((prev) => {
      const assistantMsg: Msg = { role: 'assistant', content: '' };
      const next = [...prev, assistantMsg]; // next 的类型就是 Msg[]
      aiIndexRef.current = next.length - 1;
      return next;
    });
  
    // 2) onDelta：用“替换”而不是“追加”
    const replace = (fullText: string) => {
      setMsgs(prev => {
        const i = aiIndexRef.current;
        if (i == null || i < 0 || i >= prev.length) return prev;
        const next = [...prev];
        // trySSE 已经做了 normalizeMarkdown，这里直接替换
        next[i] = { ...next[i], content: fullText };
        return next;
      });
    };
  
    try {
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content },
        replace, // ✅ 替换整段，不是 +=
        (meta) => {
          const cid = String(meta?.conversation_id || '');
          if (cid) {
            sessionStorage.setItem('conversation_id', cid);
            setConversationId(cid);
          }
        }
      );
  
      // 3) 结束后把 streaming 标记取消
      setMsgs(prev => {
        const i = aiIndexRef.current;
        if (i == null || i < 0 || i >= prev.length) return prev;
        const next = [...prev];
        next[i] = { ...next[i], streaming: false };
        return next;
      });
    } catch {
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
        calendar: calendarType, // 'gregorian' | 'lunar'
        birth_date: birthDate,  // 'YYYY-MM-DD'
        birth_time: birthTime,  // 'HH:MM'
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

      // 2) 启动会话
      sessionStorage.removeItem('conversation_id');

      // ✅ 先插入单独的“开场白”消息，再插入流式占位消息
      let assistantIndex = -1;
      setMsgs(() => {
        const next: Msg[] = [
          { role: 'assistant', content: SYSTEM_INTRO, meta: { kind: 'intro' } },
          { role: 'assistant', content: '' },
        ];
        assistantIndex = 1;
        return next;
      });

      let cidLocal = '';
      try {
        // 首选流式
        await trySSE(
          api('/chat/start'),
          { paipan: mingpan },
          (delta) => {
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
            const cid = String(meta?.conversation_id || '');
            if (cid) {
              sessionStorage.setItem('conversation_id', cid);
              setConversationId(cid);
              cidLocal = cid;
            }
          },
        );

        // 归一化 & 持久化
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
        if (cidLocal) saveConversation(cidLocal, [
          { role: 'assistant', content: SYSTEM_INTRO, meta: { kind: 'intro' } },
          { role: 'assistant', content: finalText },
        ]);
      } catch {
        // 流式失败 → 一次性
        const res = await fetch(api('/chat/start'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paipan: mingpan }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        const cid = String(data.conversation_id || '');
        if (cid) {
          sessionStorage.setItem('conversation_id', cid);
          setConversationId(cid);
        }

        const first = pickReply(data).trim();
        const initMsgs: Msg[] = [
          { role: 'assistant', content: SYSTEM_INTRO, meta: { kind: 'intro' } },
          { role: 'assistant', content: normalizeMarkdown(first || '（后端未返回解读内容）') },
        ];
        setMsgs(initMsgs);
        if (cid) saveConversation(cid, initMsgs);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCalcLoading(false);
      setBooting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fef3c7] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* ===== 顶部：页面头 + 用户信息 ===== */}
        <div className="flex items-center justify-between">
          <ChatHeader conversationId={conversationId} onBack={() => router.push('/')} />
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-white/90 px-3 py-2">
            {me?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatar_url} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-red-200" />
            )}
            <div className="leading-tight">
              <div className="text-sm font-medium">{me?.nickname || me?.username || '已登录用户'}</div>
              <div className="text-xs text-neutral-500">{me?.email || '—'}</div>
            </div>
          </div>
        </div>

        {/* ===== 快速排盘表单 ===== */}
        <div className="rounded-2xl border border-red-200 bg-white/90 p-4 sm:p-5">
          <div className="text-base font-semibold text-red-700">快速排盘</div>
          <form onSubmit={handleCalcPaipan} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm text-neutral-700 mb-1">性别</span>
              <div className="flex gap-3">
                {(['男', '女'] as const).map(g => (
                  <label
                    key={g}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition
                      ${gender === g ? 'border-red-400 bg-red-50 text-red-800'
                                      : 'border-red-200 bg-white/70 text-neutral-700 hover:bg-red-50/60'}`}
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

            <div>
              <span className="block text-sm text-neutral-700 mb-1">历法</span>
              <div className="flex gap-3">
                {(['阳历', '农历'] as const).map(c => {
                  const value = c === '阳历' ? 'gregorian' : 'lunar';
                  return (
                    <label
                      key={c}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition
                        ${calendarType === value ? 'border-red-400 bg-red-50 text-red-800'
                                                 : 'border-red-200 bg-white/70 text-neutral-700 hover:bg-red-50/60'}`}
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

            <div>
              <label className="block text-sm text-neutral-700 mb-1">出生日期</label>
              <input
                type="date"
                className="w-full rounded-xl bg-[#fff7ed] border border-red-200 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-1">出生时间</label>
              <input
                type="time"
                className="w-full rounded-xl bg-[#fff7ed] border border-red-200 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-1">出生地点</label>
              <input
                className="w-full rounded-xl bg-[#fff7ed] border border-red-200 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="如：深圳"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={calcLoading}
                className="rounded-2xl bg-[#a83232] text-[#fdf6e3] px-4 py-2 font-medium disabled:opacity-60 hover:bg-[#8c2b2b]"
              >
                {calcLoading ? '排盘中…' : '生成命盘并开始解读'}
              </button>
              {calcErr && <div className="text-sm text-red-700">{calcErr}</div>}
            </div>
          </form>
        </div>

        {/* ===== 命盘卡片 ===== */}
        {paipan && (
          <PaipanCard
            paipan={paipan}
            WuxingBadge={WuxingBadge}
            WuxingBar={WuxingBar}
            getWuxing={getWuxing}
            colorClasses={colorClasses}
            // guessPercent={(el: Wuxing) => guessElementPercent(el)}
          />
        )}

        {/* ===== 消息区 ===== */}
        <MessageList scrollRef={scrollRef} messages={msgs} Markdown={Markdown as any} />

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

        {/* ===== 快捷问题 ===== */}
        <QuickActions
          disabled={loading || booting || !conversationId}
          buttons={QUICK_BUTTONS}
          onClick={sendQuick}
        />

        {/* ===== 输入区 ===== */}
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
