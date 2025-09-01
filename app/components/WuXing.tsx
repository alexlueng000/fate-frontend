'use client';

import React from 'react';

export type Wuxing = '木' | '火' | '土' | '金' | '水';

const GAN_WUXING: Record<string, Wuxing> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

const ZHI_WUXING: Record<string, Wuxing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export function getWuxing(char: string): Wuxing | null {
  if (!char) return null;
  return (GAN_WUXING[char] as Wuxing) || (ZHI_WUXING[char] as Wuxing) || null;
}

export function colorClasses(el: Wuxing, variant: 'text' | 'bg' | 'border' = 'text') {
  const map: Record<Wuxing, { text: string; bg: string; border: string }> = {
    木: { text: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    火: { text: 'text-red-800',     bg: 'bg-red-100',     border: 'border-red-200' },
    土: { text: 'text-amber-800',   bg: 'bg-amber-100',   border: 'border-amber-200' },
    金: { text: 'text-yellow-800',  bg: 'bg-yellow-100',  border: 'border-yellow-200' },
    水: { text: 'text-sky-800',     bg: 'bg-sky-100',     border: 'border-sky-200' },
  };
  return map[el][variant];
}

/** 占位：后端提供真实五行比例时可替换 */
export function guessElementPercent(el: string): number {
  const base: Record<string, number> = { 木: 40, 火: 55, 土: 35, 金: 30, 水: 45 };
  return base[el] ?? 40;
}

export function WuxingBadge({ char }: { char: string }) {
  const el = getWuxing(char);
  if (!el) {
    return (
      <span className="px-2 py-1 rounded-lg border border-red-200 bg-white text-neutral-900">
        {char || '—'}
      </span>
    );
  }
  return (
    <span
      className={[
        'px-2 py-1 rounded-lg border font-semibold',
        colorClasses(el, 'border'),
        colorClasses(el, 'bg'),
        colorClasses(el, 'text'),
      ].join(' ')}
    >
      {char}
      <span className="ml-1 text-xs opacity-80">({el})</span>
    </span>
  );
}

export function WuxingBar({ name, percent }: { name: Wuxing; percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm font-medium text-neutral-800">
        <span className={[colorClasses(name, 'text'), 'font-semibold'].join(' ')}>{name}</span>
        <span>{percent}%</span>
      </div>
      <div
        className={[
          'h-2 w-full overflow-hidden rounded-full border',
          colorClasses(name, 'bg'),
          colorClasses(name, 'border'),
        ].join(' ')}
      >
        <div
          className={['h-full', colorClasses(name, 'text').replace('text-', 'bg-'), 'transition-all'].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
