'use client';

import { Paipan, Wuxing } from '@/app/lib/chat/types';
import { ComponentType } from 'react';

export function PaipanCard({
  paipan,
  WuxingBadge,
  WuxingBar,
  getWuxing,
  colorClasses,
}: {
  paipan: Paipan;
  WuxingBadge: ComponentType<{ char: string }>;
  WuxingBar: ComponentType<{ name: Wuxing; percent: number }>;
  getWuxing: (char: string) => Wuxing | null;
  colorClasses: (el: Wuxing, type: 'text' | 'border') => string;
}) {
  return (
    <div className="rounded-3xl border border-[rgba(142,129,116,0.15)] bg-[#fffbf7] p-6 space-y-6 shadow-sm">
      {/* 四柱表格 */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-[#c93b3a]">四柱</h4>
        <div className="grid grid-cols-5 text-center text-sm font-semibold text-neutral-900">
          <div className="text-left text-neutral-700">层级</div>
          <div>年</div>
          <div>月</div>
          <div>日</div>
          <div>时</div>
        </div>
        <div className="grid grid-cols-5 gap-y-2 rounded-2xl border border-[rgba(142,129,116,0.15)] p-3">
          <div className="flex items-center text-sm font-medium text-neutral-700">天干</div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.year?.[0] || ''} /></div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.month?.[0] || ''} /></div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.day?.[0] || ''} /></div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.hour?.[0] || ''} /></div>

          <div className="flex items-center text-sm font-medium text-neutral-700">地支</div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.year?.[1] || ''} /></div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.month?.[1] || ''} /></div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.day?.[1] || ''} /></div>
          <div className="flex items-center justify-center"><WuxingBadge char={paipan.four_pillars.hour?.[1] || ''} /></div>
        </div>
        <p className="text-xs text-neutral-600">
          颜色对应五行：木-绿、火-红、土-棕黄、金-金黄、水-蓝。仅供理性参考，关键在行动与选择。
        </p>
      </div>

      {/* 五行概览 */}
      {/* <div className="space-y-3">
        <h4 className="text-sm font-bold text-red-900">五行概览</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['木', '火', '土', '金', '水'] as Wuxing[]).map((el) => (
            <WuxingBar key={el} name={el} percent={guessPercent(el)} />
          ))}
        </div>
      </div> */}

      {/* 大运 */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-[#c93b3a]">大运</h4>
        <div className="mt-1 flex gap-3 overflow-x-auto pb-2">
          {paipan.dayun.map((d, i) => {
            const pillar = d.pillar?.join('') || '';
            const gan = pillar?.[0] || '';
            const el = getWuxing(gan) || '火';
            return (
              <div
                key={i}
                className={`shrink-0 rounded-2xl border ${colorClasses(el, 'border')} bg-white px-4 py-3 text-xs text-neutral-900 min-w-[180px] shadow-sm`}
              >
                <div>起运年龄：<span className={`${colorClasses(el, 'text')} font-semibold`}>{d.age}</span></div>
                <div className="mt-0.5">起运年份：<span className={`${colorClasses(el, 'text')} font-semibold`}>{d.start_year}</span></div>
                <div className="mt-1">大运：<span className={`font-bold ${colorClasses(el, 'text')}`}>{pillar || '—'}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
