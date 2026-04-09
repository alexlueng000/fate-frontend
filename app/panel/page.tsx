'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Markdown from '@/app/components/Markdown';
import { SimplifiedPaipanCard } from '@/app/components/chat/SimplifiedPaipanCard';
import { DetailedPaipanTable } from '@/app/components/chat/DetailedPaipanTable';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';
import { BirthDateTimeFields } from '@/app/components/chat/BirthDateTime';

import {
  Msg, Paipan, QUICK_BUTTONS,
} from '@/app/lib/chat/types';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { api, pickReply } from '@/app/lib/chat/api';
import { trySSE } from '@/app/lib/chat/sse';
import {
  saveConversation, loadConversation, getActiveConversationId,
  savePaipanLocal, loadPaipanLocal, repairCorruptedConversations,
} from '@/app/lib/chat/storage';
import { loadDefaultBirthData, saveDefaultBirthData, clearDefaultBirthData, type DefaultBirthData } from '@/app/lib/birthData';

import { SYSTEM_INTRO } from '@/app/lib/chat/constants';
import { useUser, fetchMe } from '@/app/lib/auth';

import { normalizeMarkdown } from '@/app/lib/chat/types';




export default function PanelPage() {
  const router = useRouter();

  // 组件内：必要的 ref/state（若你已存在就不要重复声明）
const aiIndexRef = useRef<number | null>(null);
const streamingLockRef = useRef(false);
const lastFullRef = useRef(''); // 防重复 setState（可选）
const mountedRef = useRef(true);


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

  // ===== 默认命盘状态 =====
  const [hasDefault, setHasDefault] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);  // 滑块开关状态

  // ===== 视图模式 =====
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

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
    // 恢复视图模式
    const savedViewMode = localStorage.getItem('paipan_view_mode');
    if (savedViewMode === 'card' || savedViewMode === 'table') {
      setViewMode(savedViewMode);
    }
  }, []);

  // ===== 加载默认命盘 =====
  useEffect(() => {
    loadDefaultBirthData().then(data => {
      if (data) {
        setGender(data.gender);
        setCalendarType(data.calendar);
        setBirthDate(data.birthDate);
        setBirthTime(data.birthTime);
        setBirthPlace(data.birthPlace);
        setHasDefault(true);
        setSaveAsDefault(true);  // 如果有默认命盘，默认开启开关
      }
    });
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



  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ===== 滚动到底 =====
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading, booting]);

  // ===== 登录校验 & 恢复最近一次会话 =====
  useEffect(() => {
    let alive = true;
    (async () => {
      // 首次加载时修复损坏的对话数据
      try {
        const repairedCount = repairCorruptedConversations();
        if (repairedCount > 0) {
          console.log(`[Storage] Repaired ${repairedCount} corrupted conversations`);
        }
      } catch (e) {
        console.warn('[Storage] Failed to repair conversations:', e);
      }

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
          setMsgs(cached.map(m =>
            m.simplify?.status === 'loading'
              ? { ...m, simplify: { ...m.simplify, status: 'error' as const, error: '已中断，请重试' } }
              : m
          ));
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
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(api('/chat'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ conversation_id: conversationId, message: content }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return pickReply(data).trim();
  };

  // ===== SSE 流式发送 =====

  const sendStream = async (content: string) => {
    if (!conversationId) throw new Error('缺少会话，请先完成排盘并开启解读。');

    // 防止首条/首次因为 StrictMode 或双击而重复触发
    if (streamingLockRef.current) {
      console.debug('[stream] blocked: already streaming');
      return;
    }
    streamingLockRef.current = true;

    // 1) 插入占位 assistant（标记 streaming），用闭包捕获索引
    let myIndex = -1;
    setMsgs(prev => {
      const next: Msg[] = [...prev, { role: 'assistant', content: '', streaming: true }];
      myIndex = next.length - 1;
      aiIndexRef.current = myIndex;
      return next;
    });

    // 2) 替换：只吃"全文"，避免 +=
    const replace = (fullText: string) => {
      if (fullText === lastFullRef.current) return; // 去抖：相同内容不刷
      lastFullRef.current = fullText;

      setMsgs(prev => {
        if (myIndex < 0 || myIndex >= prev.length) return prev;
        const next = [...prev];
        next[myIndex] = { ...next[myIndex], content: fullText };
        return next;
      });
    };


    try {
      await trySSE(
        api('/chat'),
        { conversation_id: conversationId, message: content },
        replace, // 每次都是"整段最新文本"
        (meta) => {                        // 注意：这里参数类型是 unknown（由 trySSE 决定）
          const cid = hasConversationId(meta) ? meta.conversation_id : '';
          if (cid) {
            sessionStorage.setItem('conversation_id', cid);
            setConversationId(cid);
          }
          // 保存 message_id 到消息对象
          const msgId = (meta as any)?.message_id;
          console.log('[DEBUG] Received message_id from meta:', msgId);
          if (msgId) {
            setMsgs(prev => {
              if (myIndex < 0 || myIndex >= prev.length) return prev;
              const next = [...prev];
              next[myIndex] = {
                ...next[myIndex],
                meta: { ...next[myIndex].meta, messageId: msgId }
              };
              console.log('[DEBUG] Updated message with messageId:', next[myIndex]);
              return next;
            });
          }
        }
      );

      // 3) 结束后取消 streaming
      setMsgs(prev => {
        if (myIndex < 0 || myIndex >= prev.length) return prev;
        const next = [...prev];
        const { questions, cleanedContent } = parseSuggestedQuestions(next[myIndex].content || '');
        const normalized = normalizeMarkdown(cleanedContent);
        next[myIndex] = {
          ...next[myIndex],
          streaming: false,
          content: normalized,
          suggestedQuestions: questions,
        };
        return next;
      });
    } catch (e) {
      console.warn('[stream] SSE failed, fallback once:', e);
      // 4) 降级：一次性请求并做 normalize
      const full = await sendOnce(content);
      setMsgs(prev => {
        if (myIndex < 0 || myIndex >= prev.length) return prev;
        const next = [...prev];
        const { questions, cleanedContent } = parseSuggestedQuestions(full || '（后端未返回解读内容）');
        const normalized = normalizeMarkdown(cleanedContent);
        next[myIndex] = {
          role: 'assistant',
          streaming: false,
          content: normalized,
          suggestedQuestions: questions,
        };
        return next;
      });
    } finally {
      // 确保释放锁
      streamingLockRef.current = false;
      lastFullRef.current = ''; // 重置去抖缓存，避免影响下一轮
    }
  };

  // 处理评价回调
  const handleRated = (messageIndex: number, rating: { ratingType: 'up' | 'down'; reason?: string }) => {
    setMsgs(prev => {
      const next = [...prev];
      if (messageIndex >= 0 && messageIndex < next.length) {
        next[messageIndex] = {
          ...next[messageIndex],
          userRating: rating
        };
      }
      return next;
    });
  };

  // ===== 基本交互 =====
  const send = async () => {
    if (!conversationId || streamingLockRef.current) {
      if (!conversationId) setErr('缺少会话，请先完成排盘并开启解读。');
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
    console.log("sendQuick: ", label, fullPrompt);
    if (!conversationId || streamingLockRef.current) {
      if (!conversationId) setErr('缺少会话，请先完成排盘并开启解读。');
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

  const handleQuestionClick = async (question: string) => {
    if (!conversationId || streamingLockRef.current) return;
    setErr(null);
    setMsgs((m) => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      await sendStream(question);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // ===== 切换默认命盘开关 =====
  const handleToggleDefault = async () => {
    if (saveAsDefault) {
      // 关闭开关：清除默认命盘
      setSaveAsDefault(false);
      try {
        await clearDefaultBirthData();
        setHasDefault(false);
      } catch (e) {
        console.error('Failed to clear default birth data:', e);
        setSaveAsDefault(true);  // 恢复开关状态
      }
    } else {
      // 打开开关：保存默认命盘
      if (!birthDate || !birthTime) {
        setCalcErr('请先填写出生日期和时间');
        return;
      }
      setSaveAsDefault(true);
      try {
        await saveDefaultBirthData({
          gender,
          calendar: calendarType,
          birthDate,
          birthTime,
          birthPlace: birthPlace.trim() || '北京',
        });
        setHasDefault(true);
      } catch (e) {
        console.error('Failed to save default birth data:', e);
        setSaveAsDefault(false);  // 恢复开关状态
      }
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
      const actualBirthPlace = birthPlace.trim() || '北京';
      const body = {
        gender,
        calendar: calendarType,  // 'gregorian' | 'lunar'
        birth_date: birthDate,   // 'YYYY-MM-DD'
        birth_time: birthTime,   // 'HH:MM'
        birthplace: actualBirthPlace,
        birthplace_provided: !!birthPlace.trim(),
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
          // onDelta：始终"替换整段"
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
            // 保存 message_id 到消息对象
            const msgId = (metaAny as any)?.message_id;
            console.log('[DEBUG] Start chat - Received message_id from meta:', msgId);
            if (msgId) {
              setMsgs((prev) => {
                const next = [...prev];
                if (assistantIndex >= 0 && assistantIndex < next.length) {
                  next[assistantIndex] = {
                    ...next[assistantIndex],
                    meta: { ...next[assistantIndex].meta, messageId: msgId }
                  };
                  console.log('[DEBUG] Start chat - Updated message with messageId:', next[assistantIndex]);
                }
                return next;
              });
            }
          }
        );
      } catch (err) {
        // 4) 流式失败 → 一次性兜底
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(api('/chat/start'), {
          method: 'POST',
          headers,
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

        const rawText = (data?.text || data?.content || '').trim() || '（后端未返回解读内容）';
        const { questions, cleanedContent } = parseSuggestedQuestions(rawText);
        const firstText = normalizeMarkdown(cleanedContent);
        finalTextLocal = firstText;
        setMsgs((prev) => {
          const next = [...prev];
          if (assistantIndex >= 0 && assistantIndex < next.length) {
            next[assistantIndex] = {
              role: 'assistant',
              streaming: false,
              content: firstText,
              suggestedQuestions: questions,
            };
          }
          return next;
        });
      }

      // 5) 收尾：解析推荐问题 + 归一化 + 去掉 streaming
      setMsgs((prev) => {
        const next = [...prev];
        if (assistantIndex >= 0 && assistantIndex < next.length) {
          const raw = next[assistantIndex].content || '';
          const { questions, cleanedContent } = parseSuggestedQuestions(raw);
          const normalized = normalizeMarkdown(cleanedContent);
          finalTextLocal = normalized;
          next[assistantIndex] = {
            ...next[assistantIndex],
            streaming: false,
            content: normalized,
            suggestedQuestions: questions,
          };
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

  // ===== 白话版：首次请求/重试 =====
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

  // ===== 白话版：折叠/展开 =====
  const handleSimplifyToggle = (idx: number) => {
    setMsgs(prev => {
      const next = [...prev];
      const simplify = next[idx]?.simplify;
      if (!simplify) return prev;
      next[idx] = { ...next[idx], simplify: { ...simplify, expanded: !simplify.expanded } };
      return next;
    });
  };

  const canUseQuick = !qbLoading && !loading && !booting && !!conversationId;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] pt-20 sm:pt-24">
      {/* 单列居中布局，桌面端占 80% 宽度 */}
      <div className="mx-auto w-full max-w-2xl lg:max-w-[80%] px-4 sm:px-6 pb-10 space-y-4">

        {/* ===== 桌面端：排盘表单和结果并排 ===== */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
          {/* 快速排盘表单 */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 sm:p-4 shadow-sm lg:min-h-[400px] flex flex-col">
            <h2 className="text-sm font-semibold text-[var(--color-primary)]">快速排盘</h2>

            <form onSubmit={handleCalcPaipan} className="mt-3 space-y-3 flex-1 flex flex-col">
            {/* 性别 + 历法（并排） */}
            <div className="grid grid-cols-2 gap-2">
              {/* 性别 */}
              <div>
                <span className="mb-1.5 block text-xs text-[var(--color-text-secondary)]">性别</span>
                <div className="flex gap-1.5">
                  {(['男', '女'] as const).map((g) => (
                    <label
                      key={g}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 cursor-pointer transition text-xs
                        ${gender === g
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30'}`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="sr-only"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              {/* 历法 */}
              <div>
                <span className="mb-1.5 block text-xs text-[var(--color-text-secondary)]">历法</span>
                <div className="flex gap-1.5">
                  {(['阳历', '农历'] as const).map((c) => {
                    const value = c === '阳历' ? 'gregorian' : 'lunar';
                    return (
                      <label
                        key={c}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 cursor-pointer transition text-xs
                          ${calendarType === value
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30'}`}
                      >
                        <input
                          type="radio"
                          name="calendar"
                          value={value}
                          checked={calendarType === value}
                          onChange={() => setCalendarType(value)}
                          className="sr-only"
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
              <label className="mb-1.5 block text-xs text-[var(--color-text-secondary)]">出生地点</label>
              <input
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all text-xs"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="如：北京"
              />
            </div>

            {/* 设为默认命盘开关 */}
            <label className="flex items-center gap-2 py-1 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={saveAsDefault}
                onClick={handleToggleDefault}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 ${
                  saveAsDefault ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    saveAsDefault ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {saveAsDefault ? '取消默认命盘' : '设为默认命盘'}
              </span>
            </label>

            {/* 提交 */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={calcLoading}
                className="flex-1 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-60 transition-all shadow-md shadow-[var(--color-primary)]/20 flex items-center justify-center gap-1.5"
              >
                {calcLoading ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    排盘中…
                  </>
                ) : (
                  <>
                    <span className="text-sm">🔮</span>
                    生成命盘
                  </>
                )}
              </button>
            </div>

            {calcErr && <div className="text-xs text-[var(--color-primary)] mt-1.5">{calcErr}</div>}
          </form>
        </section>

        {/* 四柱八字展示区域 */}
        <div className="lg:min-h-[400px]">
          {paipan ? (
            <div className="space-y-3">
              {/* 视图切换按钮 */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setViewMode('card');
                    localStorage.setItem('paipan_view_mode', 'card');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === 'card'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)]'
                  }`}
                >
                  简洁视图
                </button>
                <button
                  onClick={() => {
                    setViewMode('table');
                    localStorage.setItem('paipan_view_mode', 'table');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)]'
                  }`}
                >
                  详细视图
                </button>
              </div>

              {/* 排盘卡片 */}
              {viewMode === 'card' ? (
                <SimplifiedPaipanCard paipan={paipan} />
              ) : (
                <DetailedPaipanTable paipan={paipan} />
              )}
            </div>
          ) : (
            <div className="hidden lg:flex rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center mx-auto mb-4 opacity-50">
                  <span className="text-white text-2xl">盘</span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  完成排盘后，命盘将显示在此处
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* ===== 聊天区域 ===== */}
        <section className="space-y-4">
          {/* 消息列表 */}
          <MessageList
            scrollRef={scrollRef}
            messages={msgs}
            Markdown={Markdown}
            paipanData={paipan ?? undefined}
            onRated={handleRated}
            onSimplify={handleSimplify}
            onSimplifyToggle={handleSimplifyToggle}
            onQuestionClick={handleQuestionClick}
            loading={loading}
          />

          {/* 状态 & 错误 */}
          {(booting || loading) && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)]">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)]" />
              {booting ? '正在解读中…' : '发送中…'}
            </div>
          )}
          {err && (
            <div className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 text-sm text-[var(--color-primary)]">
              错误：{err}
            </div>
          )}

          {/* 快捷操作按钮 */}
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
            onClear={clearChat}
            confirmClear={true}
          />
        </section>
      </div>
    </main>
  );
}
