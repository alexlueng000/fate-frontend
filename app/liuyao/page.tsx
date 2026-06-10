'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/lib/auth';
import { liuyaoApi, PaipanRequest, HexagramDetail } from '@/app/lib/liuyao/api';
import { historyApi } from '@/app/lib/history/api';
import { getHexagramByName } from '@/app/lib/hexagram';
import {
  LIUYAO_ACTIVE_CONV_KEY,
  LIUYAO_QUICK_BUTTONS,
} from '@/app/lib/liuyao/constants';
import { api } from '@/app/lib/api';
import MarkdownView from '@/app/components/Markdown';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';
import { QuickActions } from '@/app/components/chat/QuickActions';
import { Msg, normalizeMarkdown } from '@/app/lib/chat/types';
import { parseSuggestedQuestions, restoreStoredMessage } from '@/app/lib/chat/parser';
import { saveConversation, loadConversation } from '@/app/lib/chat/storage';
import { QuotaExhaustedError } from '@/app/lib/chat/sse';
import { QuotaChip } from '@/app/components/QuotaChip';
import QuotaExhaustedDialog from '@/app/components/QuotaExhaustedDialog';
import {
  loadCareerTaskContext,
  type CareerTaskContext,
} from '@/app/lib/tasks/career';
import {
  loadRelationshipTaskContext,
  type RelationshipTaskContext,
} from '@/app/lib/tasks/relationship';

type LiuyaoTaskContext = CareerTaskContext | RelationshipTaskContext;

const QUESTION_SCENARIOS = [
  { id: 'relationship', label: '感情关系', placeholder: '例如：我是否应该主动联系对方？' },
  { id: 'career',       label: '工作事业', placeholder: '例如：我是否应该接受这个工作机会？' },
  { id: 'business',     label: '合作客户', placeholder: '例如：这个客户近期是否有机会成交？' },
  { id: 'wealth',       label: '财运决策', placeholder: '例如：这个投资项目是否值得参与？' },
  { id: 'exam',         label: '考试申请', placeholder: '例如：我这次考试能否顺利通过？' },
  { id: 'travel',       label: '出行搬迁', placeholder: '例如：我是否应该接受外地的工作机会？' },
  { id: 'other',        label: '其他',     placeholder: '例如：我和对方的关系接下来会怎样？' },
];

// Detail row — uniform, no rainbow, no decorative glyphs
function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-4 py-2.5 border-b border-[color:var(--color-border)]/60 last:border-b-0">
      <span className="shrink-0 w-20 md:w-24 text-[11px] tracking-[0.18em] uppercase text-[color:var(--color-text-muted)] font-medium">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-[color:var(--color-text-primary)] truncate" title={value}>
          {value}
        </div>
        {sub && (
          <div className="text-[12px] text-[color:var(--color-text-secondary)] mt-0.5 truncate" title={sub}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiuyaoPage() {
  const router = useRouter();
  const { user } = useUser();

  const [restoringFromHistory, setRestoringFromHistory] = useState(false);
  const [method, setMethod] = useState<'number' | 'coin' | 'time'>('number');
  const [question, setQuestion] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [numbers, setNumbers] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HexagramDetail | null>(null);

  // inline error replaces alert()
  const [formError, setFormError] = useState<string | null>(null);

  // AI conversation state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [liuyaoQuickButtons, setLiuyaoQuickButtons] =
    useState<Array<{ label: string; prompt: string }>>(LIUYAO_QUICK_BUTTONS);

  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const refreshLiuyaoQuota = async () => setQuotaRefreshKey((k) => k + 1);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaDialogMessage, setQuotaDialogMessage] = useState('');
  const [taskContext, setTaskContext] = useState<LiuyaoTaskContext | null>(null);
  const [autoStartAfterPaipan, setAutoStartAfterPaipan] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const questionParam = params.get('question');
    const scenarioParam = params.get('scenario');
    const taskParam = params.get('task');
    const modeParam = params.get('mode');
    if (questionParam) setQuestion(questionParam);
    if (scenarioParam && QUESTION_SCENARIOS.some((item) => item.id === scenarioParam)) {
      setSelectedScenario(scenarioParam);
    }
    if (taskParam === 'career') {
      setTaskContext(loadCareerTaskContext());
      if (modeParam === 'liuyao') setAutoStartAfterPaipan(true);
    } else if (taskParam === 'relationship') {
      setTaskContext(loadRelationshipTaskContext());
      if (modeParam === 'liuyao') setAutoStartAfterPaipan(true);
    }
  }, []);

  const handleLiuyaoQuotaExhausted = (e: QuotaExhaustedError, assistantIdx: number) => {
    // 移除正在 streaming 的助手消息
    setMsgs((prev) => {
      if (assistantIdx >= 0 && assistantIdx < prev.length) {
        const next = [...prev];
        next.splice(assistantIdx, 1);
        return next;
      }
      return prev;
    });
    // 显示弹窗
    setQuotaDialogMessage(e.detail);
    setQuotaDialogOpen(true);
    void refreshLiuyaoQuota();
  };

  function readConvId(meta: unknown): string {
    if (typeof meta !== 'object' || meta === null) return '';
    const v = (meta as Record<string, unknown>)['conversation_id'];
    return typeof v === 'string' ? v : '';
  }

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(api('/admin/config?key=liuyao_quick_buttons'), {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const raw = data?.value_json;
        const parsed = typeof raw === 'string' ? (JSON.parse(raw) as { items?: unknown }) : raw;
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        const filtered = (items as Array<{ label?: unknown; prompt?: unknown; order?: unknown; active?: unknown }>)
          .filter((it) => it?.active !== false && typeof it?.label === 'string' && typeof it?.prompt === 'string')
          .sort((a, b) => ((a?.order as number) ?? 0) - ((b?.order as number) ?? 0))
          .map((it) => ({ label: it.label as string, prompt: it.prompt as string }));
        if (filtered.length > 0) setLiuyaoQuickButtons(filtered);
      } catch { /* keep defaults */ }
    })();
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [msgs, sending, booting]);

  useEffect(() => {
    const urlConvId = new URLSearchParams(window.location.search).get('conv_id');
    if (!urlConvId) return;
    let alive = true;

    (async () => {
      setRestoringFromHistory(true);
      try {
        const detail = await historyApi.detail(Number(urlConvId));
        if (!alive) return;
        if (detail.type !== 'liuyao') {
          router.replace(`/chat?conv_id=${detail.id}`);
          return;
        }
        if (!detail.hexagram) throw new Error('卦象数据缺失');

        setResult(detail.hexagram as HexagramDetail);

        const cid = `liuyao_conv_${detail.id}`;
        const filtered = detail.messages.filter((m, idx) => {
          if (idx === 0 && m.role === 'user' && m.content.startsWith('请基于以下卦象做第一次解读')) {
            return false;
          }
          return m.role === 'user' || m.role === 'assistant';
        });
        const restoredMsgs: Msg[] = filtered.map(restoreStoredMessage);

        setConversationId(cid);
        setMsgs(restoredMsgs);
        try {
          saveConversation(cid, restoredMsgs, { setActive: false });
          if (detail.hexagram?.hexagram_id) {
            localStorage.setItem(LIUYAO_ACTIVE_CONV_KEY(detail.hexagram.hexagram_id), cid);
          }
        } catch {}
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '加载历史会话失败';
        setFormError(msg);
      } finally {
        if (alive) setRestoringFromHistory(false);
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (restoringFromHistory || conversationId || booting) return;
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
  }, [result?.hexagram_id, restoringFromHistory, conversationId, booting]);

  useEffect(() => {
    if (conversationId) saveConversation(conversationId, msgs, { setActive: false });
  }, [conversationId, msgs]);

  const canSend = useMemo(
    () => !!conversationId && !!input.trim() && !sending && !booting,
    [conversationId, input, sending, booting],
  );

  const currentPlaceholder = selectedScenario
    ? QUESTION_SCENARIOS.find((s) => s.id === selectedScenario)?.placeholder
    : '例如：我是否应该接受这个工作机会？';

  const handleScenarioClick = (scenarioId: string) => setSelectedScenario(scenarioId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!question.trim()) {
      setFormError('请输入问事内容');
      return;
    }

    if (method === 'number') {
      const nums = numbers.map((n) => parseInt(n));
      if (nums.some((n) => isNaN(n) || n <= 0)) {
        setFormError('请输入三个有效的正整数');
        return;
      }
    }

    setLoading(true);
    try {
      const data: PaipanRequest = {
        question: question.trim(),
        method,
        gender,
        numbers: method === 'number' ? numbers.map((n) => parseInt(n)) : undefined,
      };
      const hexagram = await liuyaoApi.paipan(data);
      setResult(hexagram);
      setConversationId(null);
      setMsgs([]);
      setInput('');
      if (autoStartAfterPaipan) {
        setLoading(false);
        await handleStartChat(hexagram);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '排盘失败，请重试';
      console.error('排盘失败:', error);
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const finalizeAssistant = (idx: number) => {
    setMsgs((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      const { questions, cleanedContent } = parseSuggestedQuestions(next[idx].content || '');
      const normalized = normalizeMarkdown(cleanedContent);
      next[idx] = { ...next[idx], content: normalized, streaming: false, suggestedQuestions: questions };
      return next;
    });
  };

  const handleStartChat = async (targetHexagram: HexagramDetail | null = result) => {
    if (!targetHexagram?.hexagram_id) return;
    setBooting(true);

    let assistantIdx = -1;
    setMsgs(() => {
      const next: Msg[] = [{ role: 'assistant', content: '', streaming: true }];
      assistantIdx = 0;
      return next;
    });

    try {
      await liuyaoApi.startChat(
        targetHexagram.hexagram_id,
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
          if (cid && targetHexagram.hexagram_id) {
            setConversationId(cid);
            try {
              localStorage.setItem(LIUYAO_ACTIVE_CONV_KEY(targetHexagram.hexagram_id), cid);
            } catch {}
          }
        },
        taskContext,
      );
      finalizeAssistant(assistantIdx);
      void refreshLiuyaoQuota();
    } catch (error: unknown) {
      if (error instanceof QuotaExhaustedError) {
        handleLiuyaoQuotaExhausted(error, assistantIdx);
        setConversationId(null);
      } else {
        const msg = error instanceof Error ? error.message : '开启对话失败，请重试';
        console.error('开启对话失败:', error);
        setFormError(msg);
        setMsgs([]);
        setConversationId(null);
      }
    } finally {
      setBooting(false);
    }
  };

  const sendStream = async (
    runner: (onDelta: (text: string) => void, onMeta: (meta: unknown) => void) => Promise<void>,
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
    } catch (error: unknown) {
      if (error instanceof QuotaExhaustedError) {
        handleLiuyaoQuotaExhausted(error, assistantIdx);
        return;
      }
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

  const sendQuick = async (label: string, prompt: string) => {
    if (!conversationId || !result?.hexagram_id) return;
    setMsgs((m) => [...m, { role: 'user', content: label }]);
    setSending(true);
    try {
      await sendStream((onDelta, onMeta) =>
        liuyaoApi.quickChat(result.hexagram_id, conversationId, label, prompt, onDelta, onMeta),
      );
    } finally {
      setSending(false);
    }
  };

  const handleQuestionClick = async (q: string) => {
    if (!conversationId || sending || !result?.hexagram_id) return;
    setMsgs((m) => [...m, { role: 'user', content: q }]);
    setSending(true);
    try {
      await sendStream((onDelta, onMeta) =>
        liuyaoApi.sendChat(result.hexagram_id, conversationId, q, onDelta, onMeta),
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '重新生成失败';
      setFormError(msg);
    } finally {
      setSending(false);
    }
  };

  // Yao line render — flat token colors, no gradient, no glow, no clip-path arrowhead
  const renderYaoLine = (
    line: { is_yang?: boolean; is_dong?: boolean; liuqin?: string; liushou?: string; dizhi?: string; wuxing?: string } | undefined,
    index: number,
    isChangeGua = false,
  ) => {
    if (!line) return null;
    const isYang = line.is_yang;
    const isDong = line.is_dong && !isChangeGua;

    const lineColor = isDong
      ? 'bg-[color:var(--color-primary)]'
      : isChangeGua
        ? 'bg-[color:var(--color-text-secondary)]'
        : 'bg-[color:var(--color-text-primary)]';

    return (
      <div key={index} className="flex items-center gap-3 py-2.5">
        <div className="flex items-center gap-2 w-16 md:w-20 justify-end">
          <span className="text-[11px] tracking-wider text-[color:var(--color-text-secondary)] font-medium">
            {line.liuqin || ''}
          </span>
          <span className="text-[11px] tracking-wider text-[color:var(--color-text-muted)]">
            {line.liushou || ''}
          </span>
        </div>

        <div className="flex-1 flex items-center">
          {isYang ? (
            <div className={`h-[3px] flex-1 ${lineColor}`} />
          ) : (
            <div className="flex-1 flex gap-2">
              <div className={`h-[3px] flex-1 ${lineColor}`} />
              <div className={`h-[3px] flex-1 ${lineColor}`} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-14 md:w-16">
          <span className="text-[11px] tracking-wider text-[color:var(--color-text-muted)]">
            {line.dizhi || ''}
          </span>
          <span className="text-[11px] tracking-wider text-[color:var(--color-text-secondary)] font-medium">
            {line.wuxing || ''}
          </span>
        </div>
      </div>
    );
  };

  // toggle button style — uniform, with aria-pressed and focus-visible ring
  const toggleClass = (active: boolean, extra = '') =>
    `min-h-[44px] px-4 py-2 text-sm tracking-[0.16em] border rounded-[3px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/24 ${
      active
        ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--color-text-inverse)]'
        : 'border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)]'
    } ${extra}`;

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <div className="relative max-w-3xl mx-auto px-4 py-10 md:py-14">
        {/* Quota chip */}
        <div className="flex justify-end mb-6">
          <QuotaChip type="liuyao_chat" refreshKey={quotaRefreshKey} />
        </div>

        {/* Header — quiet, one ornament line, no orbs/noise */}
        <header className="mb-10 text-center">
          <h1
            className="font-serif text-[1.4rem] md:text-[2.25rem] leading-[1.25] tracking-[0.01em] text-[color:var(--color-text-primary)] font-medium"
          >
            六爻问事
          </h1>
          <div className="mt-3 mx-auto h-px w-12 bg-[color:var(--color-primary)]/40" />
          <p className="mt-4 text-[13px] text-[color:var(--color-text-secondary)] tracking-[0.2em]">
            一事一卦 · 看趋势 · 看风险 · 看下一步
          </p>
        </header>

        {/* Inline form error — accessible */}
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 px-4 py-3 rounded-[3px] border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/[0.06] text-[14px] text-[color:var(--color-primary)] flex items-start justify-between gap-3"
          >
            <span>{formError}</span>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="shrink-0 text-[color:var(--color-primary)]/70 hover:text-[color:var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/24 rounded-[3px] px-1"
              aria-label="关闭提示"
            >
              ×
            </button>
          </div>
        )}

        {!result ? (
          /* === Form === */
          <div className="max-w-2xl mx-auto">
            <div className="bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] rounded-[4px] p-6 md:p-9 shadow-[var(--shadow-md)]">
              <p className="text-[14px] text-[color:var(--color-text-secondary)] mb-7 leading-relaxed">
                静心想一件你最想确认的事，然后开始起卦。
              </p>

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Gender */}
                <fieldset>
                  <legend className="block text-[11px] tracking-[0.24em] uppercase text-[color:var(--color-text-secondary)] font-medium mb-3">
                    性别
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-pressed={gender === 'male'}
                      onClick={() => setGender('male')}
                      className={toggleClass(gender === 'male')}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      aria-pressed={gender === 'female'}
                      onClick={() => setGender('female')}
                      className={toggleClass(gender === 'female')}
                    >
                      女
                    </button>
                  </div>
                </fieldset>

                {/* Question */}
                <div>
                  <label htmlFor="liuyao-question" className="block text-[11px] tracking-[0.24em] uppercase text-[color:var(--color-text-secondary)] font-medium mb-2">
                    所问之事
                  </label>
                  <p className="text-[12px] text-[color:var(--color-text-muted)] mb-3">
                    请只问一件具体的事，问题越明确，解读越准确。
                  </p>
                  <textarea
                    id="liuyao-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={currentPlaceholder}
                    className="w-full h-24 p-3 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] rounded-[3px] resize-none outline-none transition-[border-color,box-shadow] duration-200 focus:border-[color:var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)] text-[15px] leading-relaxed text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-hint)]"
                    disabled={!user}
                  />
                </div>

                {/* Scenario chips */}
                <fieldset>
                  <legend className="block text-[11px] tracking-[0.24em] uppercase text-[color:var(--color-text-secondary)] font-medium mb-3">
                    常见问题
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_SCENARIOS.map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        aria-pressed={selectedScenario === scenario.id}
                        onClick={() => handleScenarioClick(scenario.id)}
                        className={toggleClass(selectedScenario === scenario.id, '!tracking-wider')}
                      >
                        {scenario.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Method */}
                <fieldset>
                  <legend className="block text-[11px] tracking-[0.24em] uppercase text-[color:var(--color-text-secondary)] font-medium mb-3">
                    起卦方式
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: 'number' as const, name: '数字起卦', hint: '凭第一感觉输入三个数字', recommended: true },
                      { id: 'time'   as const, name: '一键起卦', hint: '根据当前时间自动起卦' },
                      { id: 'coin'   as const, name: '铜钱起卦', hint: '模拟传统铜钱起卦' },
                    ].map((m) => {
                      const active = method === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setMethod(m.id)}
                          className={`relative p-4 text-left border rounded-[3px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/24 min-h-[88px] ${
                            active
                              ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--color-text-inverse)]'
                              : 'border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[14px] font-medium tracking-wide">{m.name}</span>
                            {m.recommended && active && (
                              <span className="text-[10px] tracking-[0.2em] uppercase px-1.5 py-0.5 bg-[color:var(--color-text-inverse)]/15 rounded-[2px]">
                                推荐
                              </span>
                            )}
                          </div>
                          <p className={`text-[12px] leading-relaxed ${active ? 'text-[color:var(--color-text-inverse)]/75' : 'text-[color:var(--color-text-muted)]'}`}>
                            {m.hint}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Numbers */}
                {method === 'number' && (
                  <div className="bg-[color:var(--color-bg-alt)] p-5 rounded-[3px] border border-[color:var(--color-border)]">
                    <label className="block text-[11px] tracking-[0.24em] uppercase text-[color:var(--color-text-secondary)] font-medium mb-3">
                      请输入三个数字
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {numbers.map((num, index) => (
                        <input
                          key={index}
                          type="number"
                          value={num}
                          onChange={(e) => {
                            const newNumbers = [...numbers];
                            newNumbers[index] = e.target.value;
                            setNumbers(newNumbers);
                            if (e.target.value && index < 2) {
                              const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                              if (nextInput) nextInput.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !numbers[index] && index > 0) {
                              const prev = e.currentTarget.parentElement?.children[index - 1] as HTMLInputElement;
                              if (prev) prev.focus();
                            }
                          }}
                          aria-label={`第 ${index + 1} 个数字`}
                          placeholder={`第 ${index + 1} 个`}
                          className="p-2.5 min-h-[44px] bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] rounded-[3px] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[color:var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)] text-center text-[16px] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-hint)] placeholder:text-[12px]"
                          min="1"
                        />
                      ))}
                    </div>
                    <p className="text-[12px] text-[color:var(--color-text-muted)] mt-3 text-center">
                      不必刻意思考，凭第一感觉输入即可。
                    </p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-center pt-2">
                  {user ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary tracking-[0.24em]"
                    >
                      {loading ? '解卦中…' : '立即解卦'}
                    </button>
                  ) : (
                    <div className="text-center text-[14px] text-[color:var(--color-text-secondary)]">
                      <p className="mb-2">请先登录以使用六爻问事功能</p>
                      <a
                        href="/login"
                        className="text-[color:var(--color-primary)] underline underline-offset-4 hover:text-[color:var(--color-primary-hover)] tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/24 rounded-[2px]"
                      >
                        前往登录
                      </a>
                    </div>
                  )}
                </div>
                <p className="-mt-3 text-center text-[12px] leading-5 text-[color:var(--color-text-muted)]">
                  内容仅供娱乐参考，请理性看待。
                </p>
              </form>
            </div>
          </div>
        ) : (
          /* === Hexagram Result === */
          <div className="relative">
            <div className="bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] rounded-[4px] shadow-[var(--shadow-md)] overflow-hidden">
              {/* Question + meta */}
              <div className="px-6 md:px-9 pt-9 pb-7 border-b border-[color:var(--color-border)]">
                <div className="text-center mb-7">
                  <p className="text-[11px] tracking-[0.3em] uppercase text-[color:var(--color-text-muted)] mb-3">
                    所问之事
                  </p>
                  <h2 className="font-serif text-[1.25rem] md:text-[1.75rem] leading-[1.3] text-[color:var(--color-text-primary)] font-medium">
                    {result.question}
                  </h2>
                  <p className="mt-3 text-[12px] text-[color:var(--color-text-secondary)] tracking-wide">
                    {new Date(result.timestamp).toLocaleString('zh-CN', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Uniform detail rows — no rainbow, no glyphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
                  <div>
                    <DetailRow
                      label="性别"
                      value={result.gender === 'male' ? '男' : result.gender === 'female' ? '女' : '未知'}
                    />
                    <DetailRow
                      label="排法"
                      value={result.method === 'time' ? '时间' : result.method === 'number' ? '数字' : '铜钱'}
                      sub={
                        result.method === 'number' && result.numbers?.numbers
                          ? `数字：${result.numbers.numbers.join('、')}`
                          : undefined
                      }
                    />
                    {result.ganzhi && (
                      <DetailRow
                        label="干支"
                        value={`${result.ganzhi.year} ${result.ganzhi.month} ${result.ganzhi.day} ${result.ganzhi.hour}`}
                      />
                    )}
                    {result.solar_time && (
                      <DetailRow
                        label="真太阳时"
                        value={new Date(result.timestamp).toLocaleString('zh-CN', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                          hour: '2-digit', minute: '2-digit', second: '2-digit',
                        })}
                      />
                    )}
                  </div>
                  <div>
                    {result.lunar_date && <DetailRow label="农历" value={result.lunar_date} />}
                    {(result.jiqi?.current || result.jieqi?.current) && (
                      <DetailRow
                        label="节气"
                        value={result.jiqi?.current || result.jieqi?.current || ''}
                        sub={
                          (result.jiqi?.next_time || result.jieqi?.next_time)
                            ? `下一节气：${result.jiqi?.next_time || result.jieqi?.next_time}`
                            : undefined
                        }
                      />
                    )}
                    {result.shensha && <DetailRow label="神煞" value={result.shensha} />}
                    {result.gua_gong && <DetailRow label="卦宫" value={result.gua_gong} />}
                    {result.gua_shen && <DetailRow label="卦身" value={result.gua_shen} />}
                    {result.dong_yao && (
                      <DetailRow label="动爻" value={`第 ${result.dong_yao} 爻`} />
                    )}
                  </div>
                </div>
              </div>

              {/* Hexagrams */}
              <div className="px-4 md:px-9 py-9 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 relative">
                  {/* Main gua */}
                  <div>
                    <div className="text-center mb-7">
                      <h3
                        className="font-serif text-[1.875rem] md:text-[2.25rem] leading-[1.2] tracking-wider text-[color:var(--color-text-primary)] font-medium"
                      >
                        {result.main_gua}
                      </h3>
                      <div className="mt-2 mx-auto h-px w-12 bg-[color:var(--color-border-strong)]" />
                      <div className="mt-3 flex flex-col items-center gap-1">
                        <p className="text-[11px] tracking-[0.24em] uppercase text-[color:var(--color-text-muted)]">
                          本卦
                        </p>
                        {result.main_gua && (() => {
                          const hexInfo = getHexagramByName(result.main_gua);
                          return hexInfo ? (
                            <p className="text-[12px] text-[color:var(--color-text-secondary)]">
                              第 {hexInfo.number} 卦
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {result.lines?.lines && Array.isArray(result.lines.lines) && (
                      <>
                        <div className="bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-[4px] p-5 md:p-7">
                          <div>
                            {[...result.lines.lines].reverse().map((line, index) =>
                              renderYaoLine(line, result.lines!.lines.length - 1 - index, false),
                            )}
                          </div>
                        </div>

                        {/* Shi / Ying — quiet chips, no color saturation */}
                        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px]">
                          <span className="flex items-center gap-2 text-[color:var(--color-text-secondary)]">
                            <span className="w-1 h-1 rounded-full bg-[color:var(--color-primary)]" />
                            世爻：第 {result.shi_yao} 爻
                          </span>
                          <span className="flex items-center gap-2 text-[color:var(--color-text-secondary)]">
                            <span className="w-1 h-1 rounded-full bg-[color:var(--color-text-muted)]" />
                            应爻：第 {result.ying_yao} 爻
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Change gua or placeholder */}
                  {result.change_gua &&
                  result.lines?.lines && Array.isArray(result.lines.lines) &&
                  result.change_lines?.lines && Array.isArray(result.change_lines.lines) ? (
                    <div className="relative">
                      {/* Desktop center connector — single 1px line + 变 label */}
                      <div className="hidden md:flex absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 z-10">
                        <div className="h-12 w-px bg-[color:var(--color-border-strong)]" />
                        <span
                          className="font-serif text-[12px] text-[color:var(--color-primary)] px-1.5 bg-[color:var(--color-bg-elevated)]"
                        >
                          变
                        </span>
                        <div className="h-12 w-px bg-[color:var(--color-border-strong)]" />
                      </div>

                      <div className="text-center mb-7">
                        <h3
                          className="font-serif text-[1.875rem] md:text-[2.25rem] leading-[1.2] tracking-wider text-[color:var(--color-text-primary)] font-medium"
                        >
                          {result.change_gua}
                        </h3>
                        <div className="mt-2 mx-auto h-px w-12 bg-[color:var(--color-border-strong)]" />
                        <div className="mt-3 flex flex-col items-center gap-1">
                          <p className="text-[11px] tracking-[0.24em] uppercase text-[color:var(--color-text-muted)]">
                            变卦
                          </p>
                          {(() => {
                            const hexInfo = getHexagramByName(result.change_gua);
                            return hexInfo ? (
                              <p className="text-[12px] text-[color:var(--color-text-secondary)]">
                                第 {hexInfo.number} 卦
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      <div className="bg-[color:var(--color-bg-alt)] border border-[color:var(--color-border)] rounded-[4px] p-5 md:p-7">
                        <div>
                          {[...result.change_lines.lines].reverse().map((changeLine, index) => {
                            const originalIndex = result.change_lines!.lines.length - 1 - index;
                            return renderYaoLine(changeLine, originalIndex, true);
                          })}
                        </div>
                      </div>

                      <p className="mt-4 text-center text-[12px] text-[color:var(--color-text-muted)]">
                        动爻变化后的卦象
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-16">
                      <p className="text-[13px] text-[color:var(--color-text-muted)]">
                        此卦无动爻，无变卦
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 md:px-9 py-6 border-t border-[color:var(--color-border)] flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setConversationId(null);
                    setMsgs([]);
                    setInput('');
                  }}
                  className="btn btn-secondary"
                >
                  重新起卦
                </button>
              </div>
            </div>

            {/* AI interpretation */}
            <div
              id="interpretation-result"
              className="mt-8 bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] rounded-[4px] shadow-[var(--shadow-md)] overflow-hidden"
            >
              <div className="px-6 md:px-9 py-9">
                <div className="mb-6 text-center">
                  <h3 className="font-serif text-[1.125rem] md:text-[1.375rem] tracking-wide text-[color:var(--color-text-primary)] font-medium">
                    AI 解卦
                  </h3>
                  <div className="mt-2 mx-auto h-px w-10 bg-[color:var(--color-primary)]/40" />
                </div>

                {!conversationId && msgs.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-[14px] text-[color:var(--color-text-secondary)] mb-1">
                      卦象已成，点击下方按钮开始解读。
                    </p>
                    <p className="text-[12px] text-[color:var(--color-text-muted)] mb-7">
                      AI 将结合卦象、动爻与问题深度分析，并支持追问。
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleStartChat()}
                      disabled={booting}
                      className="btn btn-primary"
                    >
                      {booting ? '启动中…' : '开始 AI 解卦'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const last = msgs[msgs.length - 1];
                      const initialLoading =
                        booting &&
                        (msgs.length === 0 ||
                          (last?.role === 'assistant' && last?.streaming && !last?.content));
                      if (initialLoading) {
                        return (
                          <div className="rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-6 py-12 text-center">
                            <div
                              className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-[color:var(--color-border-strong)] border-t-[color:var(--color-primary)] animate-spin"
                              style={{ animationDuration: '900ms' }}
                              aria-label="AI 正在解读卦象"
                              role="status"
                            />
                            <p className="text-[14px] text-[color:var(--color-text-secondary)] mb-1">
                              AI 正在解读卦象…
                            </p>
                            <p className="text-[12px] text-[color:var(--color-text-muted)]">
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
                          containerClassName="rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] max-h-[640px]"
                        />
                      );
                    })()}
                    <QuickActions
                      disabled={sending || booting || !conversationId}
                      buttons={liuyaoQuickButtons}
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
        )}

        {/* Value cards — quiet, no emoji, no glassmorphism */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
            {[
              { title: '一事一问', desc: '六爻适合判断具体事情，不建议一次问多个问题。' },
              { title: '看清趋势', desc: '不只判断吉凶，还会分析阻力、机会与变化方向。' },
              { title: '给出建议', desc: '根据卦象生成下一步行动建议，帮助你做决策。' },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] rounded-[4px] p-5"
              >
                <h3 className="font-serif text-[15px] text-[color:var(--color-text-primary)] mb-2 tracking-wide font-medium">
                  {item.title}
                </h3>
                <p className="text-[13px] text-[color:var(--color-text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuotaExhaustedDialog
        open={quotaDialogOpen}
        onClose={() => setQuotaDialogOpen(false)}
        title="六爻次数已用完"
        message={quotaDialogMessage}
      />
    </div>
  );
}
