'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileText,
  Heart,
  ListChecks,
} from 'lucide-react';

import { useRouteGuard } from '@/app/lib/useRouteGuard';
import {
  buildRelationshipBaziPrompt,
  buildRelationshipTaskHref,
  createRelationshipTaskContext,
  savePendingRelationshipBaziPrompt,
  saveRelationshipTaskContext,
  type RelationshipTaskDraft,
  type RelationshipTaskMode,
} from '@/app/lib/tasks/relationship';
import { trackEvent } from '@/app/lib/analytics/track';

const MODE_OPTIONS: Array<{
  mode: RelationshipTaskMode;
  eyebrow: string;
  title: string;
  description: string;
  checks: string[];
  icon: typeof FileText;
}> = [
  {
    mode: 'bazi',
    eyebrow: '我想看长期关系模式',
    title: '用八字看感情节奏',
    description: '适合看你在亲密关系里的重复倾向、正缘偏好、适合主动还是观察，以及未来一段时间该怎样让关系更清楚。',
    checks: ['感情表达、依恋倾向、择偶偏好', '当前阶段宜推进还是宜观察', '未来 30 天低压力行动建议'],
    icon: FileText,
  },
  {
    mode: 'liuyao',
    eyebrow: '我有一个具体关系问题',
    title: '用六爻判断一段关系',
    description: '适合判断复合、表白、冷战、对方态度、是否继续推进，重点看当下风险和接下来要观察的信号。',
    checks: ['对方态度、关系成败倾向、风险点', '建议行动和不宜做的事', '接下来要观察的时间点'],
    icon: Compass,
  },
];

const FLOW_STEPS = ['确认关系问题', '补充当前背景', '选择观察方法', '转成行动'];

export default function RelationshipTaskPage() {
  const router = useRouter();
  const routeLoading = useRouteGuard(true, false);
  const [mode, setMode] = useState<RelationshipTaskMode>('bazi');
  const [topic, setTopic] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [options, setOptions] = useState('');
  const [timeframe, setTimeframe] = useState('未来 30 天');

  const draft: RelationshipTaskDraft = useMemo(() => ({
    mode,
    topic,
    currentSituation,
    options,
    timeframe,
  }), [currentSituation, mode, options, timeframe, topic]);

  const canStart = topic.trim().length > 0 || currentSituation.trim().length > 0 || options.trim().length > 0;

  useEffect(() => {
    if (routeLoading) return;
    trackEvent('relationship_triage_view');
  }, [routeLoading]);

  const startTask = () => {
    const context = createRelationshipTaskContext(draft);
    saveRelationshipTaskContext(context);
    if (draft.mode === 'bazi') {
      savePendingRelationshipBaziPrompt(buildRelationshipBaziPrompt(draft));
    }
    trackEvent('relationship_triage_submit', {
      payload: {
        mode: draft.mode,
        has_topic: Boolean(draft.topic.trim()),
        has_current_situation: Boolean(draft.currentSituation.trim()),
        has_options: Boolean(draft.options.trim()),
        has_timeframe: Boolean(draft.timeframe.trim()),
      },
    });
    router.push(buildRelationshipTaskHref(draft));
  };

  if (routeLoading) {
    return (
      <main className="min-h-full bg-[var(--color-bg)] px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex min-h-[55vh] max-w-5xl items-center justify-center">
          <div className="text-sm text-[var(--color-text-secondary)]">正在进入感情关系</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[var(--color-bg)] px-4 pb-24 pt-5 sm:px-8 sm:pb-10 sm:pt-7">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 border-b border-[var(--color-border)] pb-5 sm:mb-8">
          <p className="mb-2 text-[13px] font-medium tracking-[0.04em] text-[var(--color-text-muted)]">感情关系</p>
          <h1 className="font-serif text-[1.45rem] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[1.9rem]">
            先看清关系里的模式，再判断眼前这一步。
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[var(--color-text-secondary)]">
            八字看长期模式，六爻看具体关系节点。你不用先整理成标准问题，只要把卡住的地方说清楚。
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {MODE_OPTIONS.map((item) => {
            const Icon = item.icon;
            const active = mode === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(item.mode)}
                className={`group border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] sm:p-6 ${
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                    active
                      ? 'border-[var(--color-primary)]/25 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-primary)]'
                  }`}>
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <span className={`text-xs font-medium tracking-[0.04em] ${
                    active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                  }`}>
                    {active ? '已选择' : '点击选择'}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{item.eyebrow}</p>
                <h2 className="mt-2 font-serif text-xl font-medium leading-snug text-[var(--color-text-primary)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-[16px] leading-7 text-[var(--color-text-body)]">
                  {item.description}
                </p>
                <div className="mt-5 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.checks.map((check) => (
                    <div key={check} className="flex gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.6} />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-5 border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <Heart className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
            补充关键关系信息
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">你现在最想看清什么？</span>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder={mode === 'bazi' ? '例如：我为什么总是在关系里很累' : '例如：这段关系还要不要继续推进'}
                className="min-h-11 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">当前情况</span>
              <textarea
                value={currentSituation}
                onChange={(event) => setCurrentSituation(event.target.value)}
                placeholder="例如：我们最近联系变少了，我不知道是该主动沟通，还是先观察一段时间。"
                rows={4}
                className="w-full resize-none rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] leading-7 text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
                  具体对象或选择
                </span>
                <input
                  value={options}
                  onChange={(event) => setOptions(event.target.value)}
                  placeholder={mode === 'bazi' ? '例如：单身 / 暧昧对象 / 当前伴侣' : '例如：主动联系对方 / 暂时不推进'}
                  className="min-h-11 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">希望重点看多久</span>
                <input
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  placeholder="例如：未来 30 天 / 这两周 / 今年下半年"
                  className="min-h-11 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {mode === 'bazi'
                ? '下一步会进入八字对话，并要求 AI 给出关系模式、当前节奏、未来 30 天行动和复盘点。'
                : '下一步会进入六爻问事，先完成排盘，再看对方态度、风险点、行动建议和观察时间。'}
            </p>
            <button
              type="button"
              onClick={startTask}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] bg-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canStart}
            >
              进入分析
              <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </div>
        </section>

        <section className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <ListChecks className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
            这条任务流会怎么走
          </div>
          <div className="grid gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-4">
            {FLOW_STEPS.map((label, index) => (
              <div key={label} className="bg-[var(--color-bg)] p-4">
                <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
