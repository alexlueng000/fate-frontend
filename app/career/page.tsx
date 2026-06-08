'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  FileText,
  ListChecks,
} from 'lucide-react';

import { useRouteGuard } from '@/app/lib/useRouteGuard';
import {
  buildCareerTaskHref,
  createCareerTaskContext,
  saveCareerTaskContext,
  type CareerTaskDraft,
  type CareerTaskMode,
} from '@/app/lib/tasks/career';

const MODE_OPTIONS: Array<{
  mode: CareerTaskMode;
  eyebrow: string;
  title: string;
  description: string;
  checks: string[];
  icon: typeof FileText;
}> = [
  {
    mode: 'bazi',
    eyebrow: '我想看长期方向',
    title: '用八字看事业阶段',
    description: '适合看你更适合什么工作方式、今年适合进取还是稳定、未来一段时间该强化什么能力。',
    checks: ['事业特质、岗位类型、工作节奏', '当前阶段宜进取还是宜稳定', '未来 30 天行动建议'],
    icon: FileText,
  },
  {
    mode: 'liuyao',
    eyebrow: '我有一个具体选择',
    title: '用六爻判断一件事',
    description: '适合判断某个 offer、合作、跳槽机会、谈判或当下是否该推进，重点看风险和观察时间点。',
    checks: ['当前状态、成败倾向、风险点', '建议行动和不宜做的事', '接下来要观察的信号'],
    icon: Compass,
  },
];

const FLOW_STEPS = ['确认问题', '补充背景', '选择方法', '转成行动'];

export default function CareerTaskPage() {
  const router = useRouter();
  const routeLoading = useRouteGuard(true, false);
  const [mode, setMode] = useState<CareerTaskMode>('bazi');
  const [topic, setTopic] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [options, setOptions] = useState('');
  const [timeframe, setTimeframe] = useState('未来 30 天');

  const draft: CareerTaskDraft = useMemo(() => ({
    mode,
    topic,
    currentSituation,
    options,
    timeframe,
  }), [currentSituation, mode, options, timeframe, topic]);

  const canStart = topic.trim().length > 0 || currentSituation.trim().length > 0 || options.trim().length > 0;

  const startTask = () => {
    const context = createCareerTaskContext(draft);
    saveCareerTaskContext(context);
    router.push(buildCareerTaskHref(draft));
  };

  if (routeLoading) {
    return (
      <main className="min-h-full bg-[var(--color-bg)] px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex min-h-[55vh] max-w-5xl items-center justify-center">
          <div className="text-sm text-[var(--color-text-secondary)]">正在进入事业选择</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[var(--color-bg)] px-4 pb-24 pt-5 sm:px-8 sm:pb-10 sm:pt-7">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 border-b border-[var(--color-border)] pb-5 sm:mb-8">
          <p className="mb-2 text-[13px] font-medium tracking-[0.04em] text-[var(--color-text-muted)]">事业选择</p>
          <h1 className="font-serif text-[1.45rem] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[1.9rem]">
            先把问题分清，再进入对应方法。
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[var(--color-text-secondary)]">
            八字看长期趋势，六爻看具体事项。你不用先懂术语，只要把当前卡住的地方说清楚。
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
            <BriefcaseBusiness className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
            补充关键信息
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">你现在最想判断什么？</span>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder={mode === 'bazi' ? '例如：今年是否适合换工作' : '例如：这个 offer 要不要接'}
                className="min-h-11 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">当前情况</span>
              <textarea
                value={currentSituation}
                onChange={(event) => setCurrentSituation(event.target.value)}
                placeholder="例如：现在工作稳定但成长慢，最近有一个新机会，薪资更高但不确定性也更强。"
                rows={4}
                className="w-full resize-none rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] leading-7 text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
                  正在比较的选项
                </span>
                <input
                  value={options}
                  onChange={(event) => setOptions(event.target.value)}
                  placeholder={mode === 'bazi' ? '例如：继续稳定上班 / 转去业务岗' : '例如：接受 A 公司 offer'}
                  className="min-h-11 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">希望重点看多久</span>
                <input
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  placeholder="例如：未来 30 天 / 今年下半年 / 这两周"
                  className="min-h-11 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {mode === 'bazi'
                ? '下一步会进入八字对话，并要求 AI 给出未来 30 天行动建议和复盘点。'
                : '下一步会进入六爻问事，先完成排盘，再看风险点、行动建议和观察时间。'}
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
