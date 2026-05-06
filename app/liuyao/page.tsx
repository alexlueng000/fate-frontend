'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@/app/lib/auth';
import { liuyaoApi, PaipanRequest, HexagramDetail } from '@/app/lib/liuyao/api';
import { getHexagramByName } from '@/app/lib/hexagram';
import {
  LIUYAO_ACTIVE_CONV_KEY,
  LIUYAO_QUICK_BUTTONS,
  LiuyaoQuickKind,
} from '@/app/lib/liuyao/constants';
import MarkdownView from '@/app/components/Markdown';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { Msg, normalizeMarkdown } from '@/app/lib/chat/types';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { saveConversation, loadConversation } from '@/app/lib/chat/storage';

// 问事场景配置
const QUESTION_SCENARIOS = [
  {
    id: 'relationship',
    label: '感情关系',
    placeholder: '例如：我是否应该主动联系对方？',
  },
  {
    id: 'career',
    label: '工作事业',
    placeholder: '例如：我是否应该接受这个工作机会？',
  },
  {
    id: 'business',
    label: '合作客户',
    placeholder: '例如：这个客户近期是否有机会成交？',
  },
  {
    id: 'wealth',
    label: '财运决策',
    placeholder: '例如：这个投资项目是否值得参与？',
  },
  {
    id: 'exam',
    label: '考试申请',
    placeholder: '例如：我这次考试能否顺利通过？',
  },
  {
    id: 'travel',
    label: '出行搬迁',
    placeholder: '例如：我是否应该接受外地的工作机会？',
  },
  {
    id: 'other',
    label: '其他',
    placeholder: '例如：我和对方的关系接下来会怎样？',
  },
];

// ===== 排盘信息 chip 主题色 =====
type DetailTheme = 'sky' | 'violet' | 'emerald' | 'rose' | 'amber' | 'fuchsia' | 'orange';

const DETAIL_THEME: Record<DetailTheme, { bg: string; ring: string; dot: string; label: string; icon: string }> = {
  sky:     { bg: 'bg-sky-50/70',     ring: 'ring-sky-200/70',     dot: 'bg-sky-400',     label: 'text-sky-700',     icon: 'text-sky-500' },
  violet:  { bg: 'bg-violet-50/70',  ring: 'ring-violet-200/70',  dot: 'bg-violet-400',  label: 'text-violet-700',  icon: 'text-violet-500' },
  emerald: { bg: 'bg-emerald-50/70', ring: 'ring-emerald-200/70', dot: 'bg-emerald-400', label: 'text-emerald-700', icon: 'text-emerald-500' },
  rose:    { bg: 'bg-rose-50/70',    ring: 'ring-rose-200/70',    dot: 'bg-rose-400',    label: 'text-rose-700',    icon: 'text-rose-500' },
  amber:   { bg: 'bg-amber-50/70',   ring: 'ring-amber-200/70',   dot: 'bg-amber-400',   label: 'text-amber-700',   icon: 'text-amber-500' },
  fuchsia: { bg: 'bg-fuchsia-50/70', ring: 'ring-fuchsia-200/70', dot: 'bg-fuchsia-400', label: 'text-fuchsia-700', icon: 'text-fuchsia-500' },
  orange:  { bg: 'bg-orange-50/70',  ring: 'ring-orange-200/70',  dot: 'bg-orange-400',  label: 'text-orange-700',  icon: 'text-orange-500' },
};

function DetailChip({
  theme, icon, label, value, sub,
}: {
  theme: DetailTheme;
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  const t = DETAIL_THEME[theme];
  return (
    <div className={`group flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${t.ring} ${t.bg} transition-all hover:shadow-sm`}>
      <div className={`shrink-0 w-9 h-9 rounded-lg ${t.bg} ring-1 ${t.ring} flex items-center justify-center text-lg ${t.icon}`}>
        <span aria-hidden>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`w-1 h-1 rounded-full ${t.dot}`} />
          <span className={`text-[10px] tracking-[0.2em] uppercase font-medium ${t.label}`}>{label}</span>
        </div>
        <div className="text-sm text-stone-800 font-medium truncate" title={value}>{value}</div>
        {sub && (
          <div className="text-[11px] text-stone-500 mt-0.5 truncate" title={sub}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export default function LiuyaoPage() {
  const { user } = useUser();
  const [method, setMethod] = useState<'number' | 'coin' | 'time'>('number');
  const [question, setQuestion] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [numbers, setNumbers] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HexagramDetail | null>(null);

  // ===== AI 多轮对话状态 =====
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  function readConvId(meta: unknown): string {
    if (typeof meta !== 'object' || meta === null) return '';
    const v = (meta as Record<string, unknown>)['conversation_id'];
    return typeof v === 'string' ? v : '';
  }

  // 自动滚动对话区
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [msgs, sending, booting]);

  // 起卦/换卦时尝试恢复对应的对话
  useEffect(() => {
    if (!result?.hexagram_id) {
      setConversationId(null);
      setMsgs([]);
      return;
    }
    try {
      const cid = localStorage.getItem(LIUYAO_ACTIVE_CONV_KEY(result.hexagram_id));
      if (cid) {
        const cached = loadConversation(cid);
        if (cached?.length) {
          setConversationId(cid);
          setMsgs(cached);
          return;
        }
      }
    } catch {}
    setConversationId(null);
    setMsgs([]);
  }, [result?.hexagram_id]);

  // 持久化
  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs);
  }, [conversationId, msgs]);

  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !sending && !booting,
    [conversationId, input, sending, booting],
  );

  const currentPlaceholder = selectedScenario
    ? QUESTION_SCENARIOS.find(s => s.id === selectedScenario)?.placeholder
    : '例如：我是否应该接受这个工作机会？';

  const handleScenarioClick = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      alert('请输入问事内容');
      return;
    }

    if (method === 'number') {
      const nums = numbers.map(n => parseInt(n));
      if (nums.some(n => isNaN(n) || n <= 0)) {
        alert('请输入有效的数字');
        return;
      }
    }

    setLoading(true);
    try {
      const data: PaipanRequest = {
        question: question.trim(),
        method,
        gender,
        numbers: method === 'number' ? numbers.map(n => parseInt(n)) : undefined,
      };

      const hexagram = await liuyaoApi.paipan(data);
      setResult(hexagram);
      // 切换卦象时清空对话状态，由 useEffect 根据新 hexagram_id 决定是否恢复
      setConversationId(null);
      setMsgs([]);
      setInput('');
    } catch (error: any) {
      console.error('排盘失败:', error);
      alert(error.message || '排盘失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ===== AI 对话相关 handler =====

  const finalizeAssistant = (idx: number) => {
    setMsgs((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      const { questions, cleanedContent } = parseSuggestedQuestions(next[idx].content || '');
      const normalized = normalizeMarkdown(cleanedContent);
      next[idx] = {
        ...next[idx],
        content: normalized,
        streaming: false,
        suggestedQuestions: questions,
      };
      return next;
    });
  };

  const handleStartChat = async () => {
    if (!result?.hexagram_id) return;

    setBooting(true);

    let assistantIdx = -1;
    setMsgs(() => {
      const next: Msg[] = [{ role: 'assistant', content: '', streaming: true }];
      assistantIdx = 0;
      return next;
    });

    try {
      await liuyaoApi.startChat(
        result.hexagram_id,
        (delta) => {
          setMsgs((prev) => {
            const next = [...prev];
            if (assistantIdx >= 0 && assistantIdx < next.length) {
              next[assistantIdx] = { ...next[assistantIdx], content: delta };
            }
            return next;
          });
        },
        (meta) => {
          const cid = readConvId(meta);
          if (cid && result?.hexagram_id) {
            setConversationId(cid);
            try {
              localStorage.setItem(LIUYAO_ACTIVE_CONV_KEY(result.hexagram_id), cid);
            } catch {}
          }
        },
      );
      finalizeAssistant(assistantIdx);
    } catch (error: any) {
      console.error('开启对话失败:', error);
      alert(error?.message || '开启对话失败，请重试');
      setMsgs([]);
      setConversationId(null);
    } finally {
      setBooting(false);
    }
  };

  const sendStream = async (
    runner: (
      onDelta: (text: string) => void,
      onMeta: (meta: unknown) => void,
    ) => Promise<void>,
  ) => {
    let assistantIdx = -1;
    setMsgs((prev) => {
      const next: Msg[] = [...prev, { role: 'assistant', content: '', streaming: true }];
      assistantIdx = next.length - 1;
      return next;
    });

    try {
      await runner(
        (delta) => {
          setMsgs((prev) => {
            if (assistantIdx < 0 || assistantIdx >= prev.length) return prev;
            const next = [...prev];
            next[assistantIdx] = { ...next[assistantIdx], content: delta };
            return next;
          });
        },
        () => {},
      );
      finalizeAssistant(assistantIdx);
    } catch (error: any) {
      console.error('对话失败:', error);
      setMsgs((prev) => {
        if (assistantIdx < 0 || assistantIdx >= prev.length) return prev;
        const next = [...prev];
        next[assistantIdx] = {
          ...next[assistantIdx],
          content: '抱歉，AI 服务暂时不可用，请稍后再试。',
          streaming: false,
        };
        return next;
      });
    }
  };

  const send = async () => {
    if (!conversationId || !result?.hexagram_id) return;
    const content = input.trim();
    if (!content) return;
    setMsgs((m) => [...m, { role: 'user', content }]);
    setInput('');
    setSending(true);
    try {
      await sendStream((onDelta, onMeta) =>
        liuyaoApi.sendChat(result.hexagram_id, conversationId, content, onDelta, onMeta),
      );
    } finally {
      setSending(false);
    }
  };

  const sendQuick = async (label: string, kindRaw: string) => {
    if (!conversationId || !result?.hexagram_id) return;
    const kind = kindRaw as LiuyaoQuickKind;
    setMsgs((m) => [...m, { role: 'user', content: `${label}分析` }]);
    setSending(true);
    try {
      await sendStream((onDelta, onMeta) =>
        liuyaoApi.quickChat(result.hexagram_id, conversationId, kind, onDelta, onMeta),
      );
    } finally {
      setSending(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    if (!conversationId || sending || !result?.hexagram_id) return;
    setMsgs((m) => [...m, { role: 'user', content: question }]);
    setSending(true);
    try {
      await sendStream((onDelta, onMeta) =>
        liuyaoApi.sendChat(result.hexagram_id, conversationId, question, onDelta, onMeta),
      );
    } finally {
      setSending(false);
    }
  };

  const onInputKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      if (canSend) void send();
    }
  };

  const regenerate = async () => {
    if (!conversationId || !result?.hexagram_id) return;
    setSending(true);
    try {
      const data = await liuyaoApi.regenerateChat(result.hexagram_id, conversationId);
      const newReply = normalizeMarkdown(data.reply || '');
      setMsgs((prev) => {
        const lastIdx = [...prev].map((m, i) => ({ m, i }))
          .reverse()
          .find((x) => x.m.role === 'assistant')?.i;
        if (lastIdx == null) return prev;
        const next = [...prev];
        next[lastIdx] = { role: 'assistant', content: newReply };
        return next;
      });
    } catch (e: any) {
      alert(e?.message || '重新生成失败');
    } finally {
      setSending(false);
    }
  };

  const renderYaoLine = (line: any, index: number, isChangeGua = false) => {
    if (!line) return null;

    const isYang = line.is_yang;
    const isDong = line.is_dong;

    return (
      <div key={index} className="flex items-center gap-3 py-3 group">
        {/* 左侧：六亲 + 六兽 */}
        <div className="flex items-center gap-2 w-20 justify-end">
          <span className="text-xs tracking-wider text-stone-600 font-medium">
            {line.liuqin || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-500 font-light">
            {line.liushou || ''}
          </span>
        </div>

        {/* 中间：爻象 */}
        <div className="flex-1 flex items-center gap-2 relative">
          {isYang ? (
            <div
              className={`h-1.5 flex-1 transition-all duration-300 ${
                isDong && !isChangeGua
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(185,58,47,0.4)]'
                  : 'bg-stone-800'
              }`}
              style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
            />
          ) : (
            <div className="flex-1 flex gap-2">
              <div
                className={`h-1.5 flex-1 transition-all duration-300 ${
                  isDong && !isChangeGua
                    ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(185,58,47,0.4)]'
                    : 'bg-stone-800'
                }`}
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
              <div
                className={`h-1.5 flex-1 transition-all duration-300 ${
                  isDong && !isChangeGua
                    ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(185,58,47,0.4)]'
                    : 'bg-stone-800'
                }`}
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
            </div>
          )}
        </div>

        {/* 右侧：地支 + 五行 */}
        <div className="flex items-center gap-2 w-16">
          <span className="text-xs tracking-wider text-stone-500 font-light">
            {line.dizhi || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-600 font-medium">
            {line.wuxing || ''}
          </span>
        </div>
      </div>
    );
  };

  const renderChangeYaoLine = (mainLine: any, changeLine: any, index: number) => {
    if (!mainLine || !changeLine) return null;

    const isYang = changeLine.is_yang;
    const isDong = mainLine.is_dong;

    return (
      <div key={index} className="flex items-center gap-3 py-3 relative">
        {/* 动爻红框标注 */}
        {isDong && (
          <div className="absolute inset-0 -mx-2 border-2 border-red-500/60 rounded-md bg-red-50/10 pointer-events-none" />
        )}

        {/* 左侧：六亲 + 六兽 */}
        <div className="flex items-center gap-2 w-20 justify-end">
          <span className="text-xs tracking-wider text-stone-500 font-medium">
            {changeLine.liuqin || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-400 font-light">
            {changeLine.liushou || ''}
          </span>
        </div>

        {/* 中间：爻象 */}
        <div className="flex-1 flex items-center gap-2 relative z-10">
          {isYang ? (
            <div
              className="h-1.5 flex-1 bg-stone-600 opacity-60"
              style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
            />
          ) : (
            <div className="flex-1 flex gap-2">
              <div
                className="h-1.5 flex-1 bg-stone-600 opacity-60"
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
              <div
                className="h-1.5 flex-1 bg-stone-600 opacity-60"
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
            </div>
          )}
        </div>

        {/* 右侧：地支 + 五行 */}
        <div className="flex items-center gap-2 w-16">
          <span className="text-xs tracking-wider text-stone-400 font-light">
            {changeLine.dizhi || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-500 font-medium">
            {changeLine.wuxing || ''}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF9EA]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-[#1F2937] mb-3 tracking-wide">
            六爻问事
          </h1>
          <p className="text-lg text-gray-600 font-light">
            一事一卦，看趋势、看风险、看下一步
          </p>
        </div>

        {!result ? (
          /* 起卦表单 */
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-10 border border-gray-100">
            {/* 引导语 */}
            <div className="text-center mb-8 pb-6 border-b border-gray-100">
              <p className="text-gray-600 text-base leading-relaxed">
                静心想一件你最想确认的事，然后开始起卦
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: 性别选择 */}
              <div>
                <label className="block text-lg font-medium text-[#1F2937] mb-3">
                  性别
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                      gender === 'male'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    男
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 transition-all ${
                      gender === 'female'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    女
                  </button>
                </div>
              </div>

              {/* Step 2: 问事内容 */}
              <div>
                <label className="block text-lg font-medium text-[#1F2937] mb-3">
                  你想问什么事？
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  请只问一件具体的事，问题越明确，解读越准确
                </p>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={currentPlaceholder}
                  className="w-full h-28 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#B93A2F] focus:border-transparent transition-all text-base"
                  disabled={!user}
                />
              </div>

              {/* Step 3: 问事场景标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  常见问题
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => handleScenarioClick(scenario.id)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        selectedScenario === scenario.id
                          ? 'bg-[#B93A2F] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {scenario.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: 起卦方式 */}
              <div>
                <label className="block text-lg font-medium text-[#1F2937] mb-3">
                  选择起卦方式
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 数字起卦 - 移到第一位作为推荐 */}
                  <button
                    type="button"
                    onClick={() => setMethod('number')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      method === 'number'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base">数字起卦</span>
                      {method === 'number' && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">推荐</span>
                      )}
                    </div>
                    <p className={`text-sm ${method === 'number' ? 'text-white/90' : 'text-gray-500'}`}>
                      凭第一感觉输入三个数字
                    </p>
                  </button>

                  {/* 一键起卦 */}
                  <button
                    type="button"
                    onClick={() => setMethod('time')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      method === 'time'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    <div className="font-semibold text-base mb-2">一键起卦</div>
                    <p className={`text-sm ${method === 'time' ? 'text-white/90' : 'text-gray-500'}`}>
                      根据当前时间自动起卦，适合快速问事
                    </p>
                  </button>

                  {/* 铜钱起卦 */}
                  <button
                    type="button"
                    onClick={() => setMethod('coin')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      method === 'coin'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    <div className="font-semibold text-base mb-2">铜钱起卦</div>
                    <p className={`text-sm ${method === 'coin' ? 'text-white/90' : 'text-gray-500'}`}>
                      模拟传统铜钱起卦，更有仪式感
                    </p>
                  </button>
                </div>
              </div>

              {/* 数字输入（仅在选择数字起卦时显示） */}
              {method === 'number' && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    请输入三个数字
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {numbers.map((num, index) => (
                      <input
                        key={index}
                        type="number"
                        value={num}
                        onChange={(e) => {
                          const newNumbers = [...numbers];
                          newNumbers[index] = e.target.value;
                          setNumbers(newNumbers);

                          // 自动跳转到下一个输入框
                          if (e.target.value && index < 2) {
                            const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                            if (nextInput) {
                              nextInput.focus();
                            }
                          }
                        }}
                        placeholder={`第${index + 1}个数字`}
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B93A2F] focus:border-transparent text-center text-lg"
                        min="1"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    不必刻意思考，凭第一感觉输入即可
                  </p>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex justify-center pt-4">
                {user ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-16 py-4 bg-[#B93A2F] text-white text-lg font-medium rounded-lg hover:bg-[#9a2f26] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? '解卦中...' : '立即解卦'}
                  </button>
                ) : (
                  <div className="text-gray-500 text-center">
                    <p className="mb-3">请先登录以使用六爻问事功能</p>
                    <a href="/login" className="text-[#B93A2F] hover:underline">
                      前往登录
                    </a>
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* 卦象结果 - 双卦象展示 */
          <div className="relative">
            {/* 背景纹理 */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* 主内容区 */}
            <div className="relative bg-gradient-to-b from-stone-50 via-amber-50/30 to-stone-50 rounded-2xl shadow-2xl border border-stone-200/50 overflow-hidden">
              {/* 顶部装饰线 */}
              <div className="h-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

              {/* 问事内容和基本信息 */}
              <div className="px-8 pt-10 pb-8 border-b border-stone-200/50">
                <div className="max-w-4xl mx-auto">
                  {/* 问事内容 - 更突出的展示 */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/40"></div>
                      <p className="text-xs tracking-[0.4em] text-amber-600/70 uppercase font-light">
                        所问之事
                      </p>
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/40"></div>
                    </div>
                    <h2 className="text-3xl md:text-4xl text-stone-800 leading-relaxed font-medium tracking-wide mb-2">
                      {result.question}
                    </h2>
                    <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/50">
                      <p className="text-xs text-amber-700">
                        {new Date(result.timestamp).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* 基本信息 - 卡片式布局 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-stone-200/50">
                      <p className="text-[10px] tracking-wider text-stone-400 uppercase mb-1.5">性别</p>
                      <p className="text-base text-stone-800 font-medium">
                        {result.gender === 'male' ? '男' : result.gender === 'female' ? '女' : '未知'}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-stone-200/50">
                      <p className="text-[10px] tracking-wider text-stone-400 uppercase mb-1.5">排法</p>
                      <p className="text-base text-stone-800 font-medium">
                        {result.method === 'time' ? '时间' : result.method === 'number' ? '数字' : '铜钱'}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 text-center border border-stone-200/50 md:col-span-2">
                      <p className="text-[10px] tracking-wider text-stone-400 uppercase mb-1.5">干支</p>
                      {result.ganzhi && (
                        <p className="text-sm text-stone-800 font-medium tracking-wide">
                          {result.ganzhi.year} {result.ganzhi.month} {result.ganzhi.day} {result.ganzhi.hour}
                        </p>
                      )}
                    </div>
                  </div>


                  {/* 详细排盘信息 - 主题色卡片网格 */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.solar_time && (
                      <DetailChip
                        theme="sky"
                        icon="☀"
                        label="真太阳时"
                        value={new Date(result.timestamp).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      />
                    )}

                    {result.lunar_date && (
                      <DetailChip
                        theme="violet"
                        icon="☾"
                        label="农历"
                        value={result.lunar_date}
                      />
                    )}

                    {(result.jiqi?.current || result.jieqi?.current) && (
                      <DetailChip
                        theme="emerald"
                        icon="❀"
                        label="节气"
                        value={result.jiqi?.current || result.jieqi?.current || ''}
                        sub={
                          (result.jiqi?.next_time || result.jieqi?.next_time)
                            ? `下一节气：${result.jiqi?.next_time || result.jieqi?.next_time}`
                            : undefined
                        }
                      />
                    )}

                    {result.shensha && (
                      <DetailChip
                        theme="rose"
                        icon="✦"
                        label="神煞"
                        value={result.shensha}
                      />
                    )}

                    {result.gua_gong && (
                      <DetailChip
                        theme="amber"
                        icon="☰"
                        label="卦宫"
                        value={result.gua_gong}
                      />
                    )}

                    {result.gua_shen && (
                      <DetailChip
                        theme="fuchsia"
                        icon="◉"
                        label="卦身"
                        value={result.gua_shen}
                      />
                    )}

                    {result.dong_yao && (
                      <DetailChip
                        theme="orange"
                        icon="↯"
                        label="动爻"
                        value={`第${result.dong_yao}爻`}
                        sub={
                          result.method === 'number' && result.numbers?.numbers
                            ? `数字：${result.numbers.numbers.join('、')}`
                            : undefined
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 双卦象展示区 */}
              <div className="px-8 py-12">
                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
                    {/* 本卦 */}
                    <div className="relative">
                      {/* 卦名 */}
                      <div className="text-center mb-8">
                        <div className="inline-block relative">
                          <h3
                            className="text-5xl font-serif text-stone-900 tracking-wider relative z-10"
                            style={{ fontFamily: "'Noto Serif SC', serif" }}
                          >
                            {result.main_gua}
                          </h3>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-1">
                          <p className="text-xs tracking-[0.25em] text-stone-500 uppercase font-light">
                            本卦
                          </p>
                          {(() => {
                            if (!result.main_gua) return null;
                            const hexInfo = getHexagramByName(result.main_gua);
                            if (hexInfo) {
                              return (
                                <p className="text-xs text-stone-600 font-light">
                                  第 {hexInfo.number} 卦
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* 六爻图 */}
                      {result.lines && result.lines.lines && Array.isArray(result.lines.lines) && (
                        <div className="relative">
                          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-stone-200/50 relative overflow-hidden">
                            {/* 装饰性背景 */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/20 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-100/20 rounded-full blur-2xl"></div>

                            <div className="relative z-10">
                              {[...result.lines.lines].reverse().map((line, index) =>
                                renderYaoLine(line, result.lines!.lines.length - 1 - index, false)
                              )}
                            </div>
                          </div>

                          {/* 世应爻标注 - 优化样式 */}
                          <div className="mt-5 flex justify-center gap-6">
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200/50">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                              <span className="text-xs text-amber-800 font-medium">世爻：第{result.shi_yao}爻</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-full border border-sky-200/50">
                              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-sm" />
                              <span className="text-xs text-sky-800 font-medium">应爻：第{result.ying_yao}爻</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 变卦 */}
                    {result.change_gua && result.lines && result.lines.lines && Array.isArray(result.lines.lines) && result.change_lines && result.change_lines.lines && Array.isArray(result.change_lines.lines) ? (
                      <div className="relative">
                        {/* 连接箭头 (仅桌面显示) - 圆形渐变徽章 */}
                        <div className="hidden md:block absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="relative w-12 h-12">
                              {/* 外层光晕 */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/60 via-rose-200/50 to-red-200/40 blur-md animate-pulse" />
                              {/* 主体徽章 */}
                              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 via-white to-rose-50 ring-2 ring-amber-300/60 shadow-lg flex items-center justify-center">
                                <svg
                                  width="22"
                                  height="22"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="text-red-600/80"
                                >
                                  <path
                                    d="M5 12H19M19 12L13 6M19 12L13 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </div>
                            <span
                              className="text-[10px] tracking-[0.4em] text-red-700/70 font-medium px-2 py-0.5 rounded-full bg-amber-50/80 ring-1 ring-amber-200/60"
                              style={{ fontFamily: "'Noto Serif SC', serif" }}
                            >
                              变
                            </span>
                          </div>
                        </div>

                        {/* 卦名 */}
                        <div className="text-center mb-8">
                          <div className="inline-block relative">
                            <h3
                              className="text-5xl font-serif text-stone-800 tracking-wider relative z-10"
                              style={{ fontFamily: "'Noto Serif SC', serif" }}
                            >
                              {result.change_gua}
                            </h3>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
                          </div>
                          <div className="mt-4 flex flex-col items-center gap-1">
                            <p className="text-xs tracking-[0.25em] text-stone-400 uppercase font-light">
                              变卦
                            </p>
                            {(() => {
                              if (!result.change_gua) return null;
                              const hexInfo = getHexagramByName(result.change_gua);
                              if (hexInfo) {
                                return (
                                  <p className="text-xs text-stone-500 font-light">
                                    第 {hexInfo.number} 卦
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>

                        {/* 六爻图 */}
                        <div className="relative">
                          <div className="bg-gradient-to-br from-stone-100/60 to-stone-50/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-stone-200/40 relative overflow-hidden">
                            {/* 装饰性背景 */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-stone-200/20 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-stone-300/20 rounded-full blur-2xl"></div>

                            <div className="relative z-10">
                              {Array.isArray(result.change_lines.lines) && [...result.change_lines.lines].reverse().map((changeLine, index) => {
                                const originalIndex = result.change_lines!.lines.length - 1 - index;
                                const mainLine = result.lines!.lines[originalIndex];
                                return renderChangeYaoLine(mainLine, changeLine, originalIndex);
                              })}
                            </div>
                          </div>

                          {/* 变化说明 */}
                          <div className="mt-5 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100/60 rounded-full border border-stone-200/50">
                              <svg className="w-3 h-3 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <span className="text-xs text-stone-600 font-light tracking-wide">
                                动爻变化后的卦象
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 无变卦时显示占位 */
                      <div className="relative flex items-center justify-center">
                        <div className="text-center py-20">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 32 32"
                              fill="none"
                              className="text-stone-300"
                            >
                              <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
                              <path
                                d="M16 12V16M16 20H16.01"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-stone-400 tracking-wide font-light">
                            此卦无动爻，无变卦
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部操作区 */}
              <div className="px-8 pb-10 pt-6 border-t border-stone-200/50 bg-gradient-to-b from-transparent to-stone-50/50">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button
                    onClick={() => {
                      setResult(null);
                      setConversationId(null);
                      setMsgs([]);
                      setInput('');
                    }}
                    className="group px-10 py-3.5 bg-white text-stone-700 border border-stone-300 rounded-full hover:border-red-600 hover:text-red-600 transition-all duration-300 shadow-sm hover:shadow-md text-sm tracking-wider font-light"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="transition-transform group-hover:rotate-180 duration-500"
                      >
                        <path
                          d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 2L8 6M8 2L11 2M8 2L8 2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      重新起卦
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI解卦区域 - 始终显示 */}
            <div
              id="interpretation-result"
              className="mt-8 bg-white rounded-2xl shadow-xl border border-stone-200/50 overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
              <div className="px-8 py-10">
                <div className="max-w-3xl mx-auto">
                  {/* 标题 */}
                  <div className="mb-6 text-center">
                    <h3 className="text-2xl font-serif text-stone-800 tracking-wide flex items-center justify-center gap-3">
                      <span className="inline-block w-8 h-px bg-gradient-to-r from-transparent to-amber-600/40" />
                      AI 解卦
                      <span className="inline-block w-8 h-px bg-gradient-to-l from-transparent to-amber-600/40" />
                    </h3>
                  </div>

                  {/* 内容区域 */}
                  {!conversationId && msgs.length === 0 ? (
                    /* 未开始解卦 - 显示按钮 */
                    <div className="text-center py-12">
                      <div className="mb-6">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                          <svg
                            width="40"
                            height="40"
                            viewBox="0 0 40 40"
                            fill="none"
                            className="text-amber-600"
                          >
                            <path
                              d="M20 10V20M20 20V30M20 20H30M20 20H10"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                          </svg>
                        </div>
                        <p className="text-stone-500 text-sm mb-2">卦象已成，点击下方按钮开始解读</p>
                        <p className="text-stone-400 text-xs">AI 将结合卦象、动爻和问题为你深度分析，并支持追问</p>
                      </div>
                      <button
                        onClick={handleStartChat}
                        disabled={booting}
                        className="group relative px-12 py-4 bg-gradient-to-r from-[#B93A2F] to-[#9a2f26] text-white rounded-full hover:shadow-2xl transition-all duration-300 shadow-lg text-base tracking-wider font-light active:scale-95 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out" />
                        <span className="relative z-10 flex items-center gap-3">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            className="transition-transform group-hover:rotate-90 duration-300"
                          >
                            <path
                              d="M10 4V10M10 10V16M10 10H16M10 10H4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                          </svg>
                          {booting ? '启动中…' : '开始 AI 解卦'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    /* 已开始 - 完整对话区 */
                    <div className="animate-fade-in space-y-4">
                      {(() => {
                        const last = msgs[msgs.length - 1];
                        const initialLoading =
                          booting &&
                          (msgs.length === 0 ||
                            (last?.role === 'assistant' &&
                              last?.streaming &&
                              !last?.content));
                        if (initialLoading) {
                          return (
                            <div className="rounded-xl border border-stone-200/60 bg-white/80 px-6 py-14 text-center">
                              <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" />
                                <div className="absolute inset-3 rounded-full border-4 border-amber-50" />
                                <div
                                  className="absolute inset-3 rounded-full border-4 border-transparent border-b-amber-400 animate-spin"
                                  style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    className="text-amber-600 animate-pulse"
                                  >
                                    <path
                                      d="M16 8V16M16 16V24M16 16H24M16 16H8"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <p className="text-stone-600 text-base mb-1.5 animate-pulse">
                                AI 正在解读卦象…
                              </p>
                              <p className="text-stone-400 text-sm">
                                分析卦象结构、动爻变化与问题关联
                              </p>
                            </div>
                          );
                        }
                        return (
                          <MessageList
                            scrollRef={chatScrollRef}
                            messages={msgs}
                            Markdown={MarkdownView}
                            onQuestionClick={handleQuestionClick}
                            loading={sending || booting}
                            containerClassName="rounded-xl border border-stone-200/60 bg-white/80 max-h-[640px]"
                          />
                        );
                      })()}
                      <QuickActions
                        disabled={sending || booting || !conversationId}
                        buttons={LIUYAO_QUICK_BUTTONS}
                        onClick={sendQuick}
                      />
                      <InputArea
                        value={input}
                        onChange={setInput}
                        onKeyDown={onInputKeyDown}
                        canSend={canSend}
                        sending={sending}
                        disabled={booting || !conversationId}
                        onSend={send}
                        onRegenerate={regenerate}
                        placeholder="基于此卦继续追问，例如：现在主动联系合适吗？"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-fade-in {
                animation: fadeIn 0.5s ease-out forwards;
              }
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}

        {/* 价值说明卡片 */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-semibold text-[#1F2937] text-lg mb-2">一事一问</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                六爻适合判断具体事情，不建议一次问多个问题
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-[#1F2937] text-lg mb-2">看清趋势</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                不只判断吉凶，还会分析阻力、机会和变化方向
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-semibold text-[#1F2937] text-lg mb-2">给出建议</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                根据卦象生成下一步行动建议，帮助你做决策
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
