'use client';

import { getSolarTermSentence, getTimeOfDaySentence } from '@/app/lib/xinji/calendar';

export default function JieqiHeader() {
  const solarTerm = getSolarTermSentence();
  const tod = getTimeOfDaySentence();

  return (
    <div className="text-center">
      <p className="text-[11px] tracking-[0.3em] text-[var(--color-text-hint)] mb-8">
        天地有节气 · 人心有潮汐 · 所有记录只留在你这里
      </p>

      <div className="space-y-3">
        <p className="text-xl sm:text-2xl font-[var(--font-display)] text-[var(--color-text-primary)] leading-relaxed">
          {solarTerm.sentence}
        </p>
        <p className="text-base sm:text-lg font-light text-[var(--color-text-secondary)] leading-relaxed">
          {tod.sentence}
        </p>
      </div>

      <div className="mt-7 inline-flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span>{solarTerm.label}</span>
        <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
        <span>{tod.label}</span>
      </div>
    </div>
  );
}
