'use client';

import { getSolarTermSentence, getTimeOfDaySentence } from '@/app/lib/xinji/calendar';

export default function JieqiHeader() {
  const solarTerm = getSolarTermSentence();
  const tod = getTimeOfDaySentence();

  return (
    <div className="text-center">
      <p className="text-[11px] tracking-[0.3em] text-slate-400 mb-8">
        天地有节气 · 人心有潮汐 · 所有记录只留在你这里
      </p>

      <div className="space-y-3">
        <p className="text-xl sm:text-2xl font-serif text-slate-800 leading-relaxed">
          {solarTerm.sentence}
        </p>
        <p className="text-base sm:text-lg font-light text-slate-600 leading-relaxed">
          {tod.sentence}
        </p>
      </div>

      <div className="mt-7 inline-flex items-center gap-3 text-xs text-slate-400 tracking-widest">
        <span>{solarTerm.label}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>{tod.label}</span>
      </div>
    </div>
  );
}
