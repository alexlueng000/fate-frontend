'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileText,
  ListChecks,
} from 'lucide-react';

import { useRouteGuard } from '@/app/lib/useRouteGuard';

const BAZI_PROMPT = '我正在纠结工作或事业选择，请基于我的八字，帮我看长期事业方向、当前阶段节奏、适合的岗位类型，以及未来30天可以采取的行动。';
const LIUYAO_QUESTION = '我正在判断一个具体的工作或事业选择，请帮我看这件事现在能不能推进、风险在哪里，以及接下来应该怎么做。';

const baziHref = `/panel?task=career&prompt=${encodeURIComponent(BAZI_PROMPT)}`;
const liuyaoHref = `/liuyao?task=career&scenario=career&question=${encodeURIComponent(LIUYAO_QUESTION)}`;

export default function CareerTaskPage() {
  const routeLoading = useRouteGuard(true, false);

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
            先判断问题类型，再进入对应方法。
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[var(--color-text-secondary)]">
            八字看长期趋势，六爻看具体事项。你不用先懂术语，只需要判断自己现在卡在哪一种问题里。
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <Link
            href={baziHref}
            className="group border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]">
                <FileText className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" strokeWidth={1.6} />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">我想看长期方向</p>
            <h2 className="mt-2 font-serif text-xl font-medium leading-snug text-[var(--color-text-primary)]">
              用八字看事业阶段
            </h2>
            <p className="mt-3 text-[16px] leading-7 text-[var(--color-text-body)]">
              适合看你更适合什么工作方式、今年适合进取还是稳定、未来一段时间该强化什么能力。
            </p>
            <div className="mt-5 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.6} />
                <span>事业特质、岗位类型、工作节奏</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.6} />
                <span>当前阶段宜进取还是宜稳定</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.6} />
                <span>未来 30 天行动建议</span>
              </div>
            </div>
          </Link>

          <Link
            href={liuyaoHref}
            className="group border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]">
                <Compass className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" strokeWidth={1.6} />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">我有一个具体选择</p>
            <h2 className="mt-2 font-serif text-xl font-medium leading-snug text-[var(--color-text-primary)]">
              用六爻判断一件事
            </h2>
            <p className="mt-3 text-[16px] leading-7 text-[var(--color-text-body)]">
              适合判断某个 offer、合作、跳槽机会、谈判或当下是否该推进，重点看风险和观察时间点。
            </p>
            <div className="mt-5 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.6} />
                <span>当前状态、成败倾向、风险点</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.6} />
                <span>建议行动和不宜做的事</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.6} />
                <span>接下来要观察的信号</span>
              </div>
            </div>
          </Link>
        </section>

        <section className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <ListChecks className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
            这条任务流会怎么走
          </div>
          <div className="grid gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-4">
            {['确认问题', '选择方法', '给出分析', '转成行动'].map((label, index) => (
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
