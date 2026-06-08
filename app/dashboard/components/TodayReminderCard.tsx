'use client';

import { CalendarDays, Clock3, Moon, Sparkles } from 'lucide-react';

export type TodayReminder = {
  lunar_display: string;
  theme: string;
  title: string;
  suitable_actions: string[];
  caution_actions: string[];
  reminder: string;
  closing_sentence: string;
  basis?: string;
  focus?: string;
  day_master?: string | null;
  day_ganzhi?: string;
};

const FALLBACK_REMINDER: TodayReminder = {
  lunar_display: '',
  theme: '先整理，再行动',
  title: '节律与整理',
  suitable_actions: ['梳理计划', '补充资料', '低压力沟通'],
  caution_actions: ['冲动承诺', '情绪化判断', '一次定死'],
  reminder: '先把乱的部分理顺，再决定下一步。',
  closing_sentence: '今天不一定要推进很多，但适合先把心里乱的部分理顺。',
};

function joinActions(actions: string[]) {
  return actions.filter(Boolean).slice(0, 3).join('，');
}

type TodayReminderCardProps = {
  reminder: TodayReminder | null;
};

export function TodayReminderCard({ reminder }: TodayReminderCardProps) {
  const data = reminder ?? FALLBACK_REMINDER;
  const suitable = joinActions(data.suitable_actions) || joinActions(FALLBACK_REMINDER.suitable_actions);
  const caution = joinActions(data.caution_actions) || joinActions(FALLBACK_REMINDER.caution_actions);

  return (
    <section className="mb-5 border-y border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-primary)]">
            <Clock3 className="h-4 w-4" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">今日八字提示</p>
            <h2 className="mt-1 font-serif text-[1.35rem] font-medium leading-snug text-[var(--color-text-primary)] sm:text-2xl">
              {data.title}
            </h2>
            {data.lunar_display && (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-[var(--color-text-muted)]">
                <CalendarDays className="h-3.5 w-3.5 text-[var(--color-text-muted)]" strokeWidth={1.6} />
                <span>{data.lunar_display}</span>
              </div>
            )}
            <p className="mt-2 max-w-[50ch] text-[15px] leading-7 text-[var(--color-text-body)]">
              {data.closing_sentence}
            </p>
            {data.basis && (
              <p className="mt-1 max-w-[56ch] text-xs leading-5 text-[var(--color-text-muted)]">
                {data.basis}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={1.6} />
              适合
            </div>
            <p className="text-sm leading-6 text-[var(--color-text-body)]">{suitable}</p>
          </div>
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
              <Moon className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={1.6} />
              少做
            </div>
            <p className="text-sm leading-6 text-[var(--color-text-body)]">{caution}</p>
          </div>
          <div className="border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={1.6} />
              提醒
            </div>
            <p className="text-sm leading-6 text-[var(--color-text-body)]">{data.reminder}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
