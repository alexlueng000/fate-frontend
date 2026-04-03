'use client';

import { Paipan } from '@/app/lib/chat/types';

interface SimplifiedPaipanCardProps {
  paipan: Paipan;
}

const TIANGAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

const DIZHI_WUXING: Record<string, string> = {
  寅: '木', 卯: '木', 巳: '火', 午: '火',
  丑: '土', 辰: '土', 未: '土', 戌: '土',
  申: '金', 酉: '金', 亥: '水', 子: '水',
};

const WUXING_CLASS: Record<string, string> = {
  木: 'wuxing-wood', 火: 'wuxing-fire', 土: 'wuxing-earth',
  金: 'wuxing-metal', 水: 'wuxing-water',
};

const PILLAR_STYLES = [
  { name: '年', cardBg: 'bg-emerald-50/40', ganBg: 'bg-white', zhiBg: 'bg-white/80', border: 'border-emerald-200/60', shadow: 'shadow-sm', labelColor: 'text-emerald-700' },
  { name: '月', cardBg: 'bg-emerald-50/40', ganBg: 'bg-white', zhiBg: 'bg-white/80', border: 'border-emerald-200/60', shadow: 'shadow-sm', labelColor: 'text-emerald-700' },
  { name: '日', cardBg: 'bg-amber-50', ganBg: 'bg-white', zhiBg: 'bg-white/80', border: 'border-amber-300', shadow: 'shadow-md shadow-amber-200/50', labelColor: 'text-amber-800', highlight: true },
  { name: '时', cardBg: 'bg-gray-50', ganBg: 'bg-white', zhiBg: 'bg-white/80', border: 'border-gray-200', shadow: 'shadow-sm', labelColor: 'text-gray-700' },
];

function WuxingBadge({ char, lookup }: { char: string; lookup: Record<string, string> }) {
  const element = lookup[char];
  if (!element) return null;
  const cls = WUXING_CLASS[element] ?? '';
  return (
    <span className={`inline-flex items-center justify-center text-[10px] font-medium px-2 py-0.5 rounded-full border mt-1.5 leading-tight ${cls}`}>
      {element}
    </span>
  );
}

export function SimplifiedPaipanCard({ paipan }: SimplifiedPaipanCardProps) {
  const pillars = [
    { gan: paipan.four_pillars.year?.[0],  zhi: paipan.four_pillars.year?.[1] },
    { gan: paipan.four_pillars.month?.[0], zhi: paipan.four_pillars.month?.[1] },
    { gan: paipan.four_pillars.day?.[0],   zhi: paipan.four_pillars.day?.[1] },
    { gan: paipan.four_pillars.hour?.[0],  zhi: paipan.four_pillars.hour?.[1] },
  ];

  const dayunList = paipan.dayun?.slice(0, 5) || [];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm h-full flex flex-col overflow-hidden">

      {/* 顶部金色装饰线 */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-60" />

      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 sm:px-4 pt-3 pb-2">
        <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] whitespace-nowrap tracking-wide">
          四柱八字
        </h3>
        <span className="text-[9px] sm:text-[10px] text-[var(--color-text-hint)] whitespace-nowrap">
          您的命盘
        </span>
      </div>

      {/* 四柱 */}
      <div className="flex gap-2 sm:gap-3 px-3 sm:px-4 pb-4">
        {PILLAR_STYLES.map((style, i) => {
          const { gan, zhi } = pillars[i];
          const isDay = i === 2;
          return (
            <div key={style.name} className="flex flex-col items-center flex-1 min-w-0">
              {/* 柱名 */}
              <div className="mb-2">
                <span className={`text-xs font-semibold ${style.labelColor}`}>{style.name}</span>
              </div>

              {/* 卡片：天干 + 分隔 + 地支 */}
              <div className={`w-full rounded-xl border-2 ${style.border} ${style.cardBg} ${style.shadow} ${isDay ? 'ring-2 ring-[var(--color-gold)]/30' : ''} overflow-hidden transition-all duration-200 hover:shadow-lg`}>
                {/* 天干 */}
                <div className={`${style.ganBg} px-2 py-3 text-center flex flex-col items-center`}>
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                    {gan || '—'}
                  </span>
                  <WuxingBadge char={gan ?? ''} lookup={TIANGAN_WUXING} />
                </div>

                {/* 分隔线 */}
                <div className="border-t border-dashed border-gray-300/60" />

                {/* 地支 */}
                <div className={`${style.zhiBg} px-2 py-3 text-center flex flex-col items-center`}>
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                    {zhi || '—'}
                  </span>
                  <WuxingBadge char={zhi ?? ''} lookup={DIZHI_WUXING} />
                </div>
              </div>

              {/* 日主标记 */}
              {isDay && (
                <div className="mt-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold-dark)] border border-[var(--color-gold)]/40 font-medium">
                    日主
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 大运 */}
      {dayunList.length > 0 && (
        <div className="mt-auto border-t border-[var(--color-border-subtle)] px-3 sm:px-4 pt-3 pb-3">
          <div className="text-[10px] text-[var(--color-text-muted)] mb-2 font-medium tracking-wide">大运</div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
            {dayunList.map((dayun, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center flex-shrink-0 min-w-[60px] sm:min-w-[70px] rounded-xl border-2 px-3 py-2.5 bg-white transition-all duration-200 ${
                  idx === 0
                    ? 'border-[var(--color-primary)]/50 shadow-md shadow-[var(--color-primary)]/10 scale-105'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-accent)] hover:shadow-md'
                }`}
              >
                <div className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                  {dayun.pillar?.[0]}{dayun.pillar?.[1]}
                </div>
                <div className="text-[10px] text-[var(--color-text-hint)] mt-1 font-medium">
                  {dayun.age}岁
                </div>
                {dayun.start_year && (
                  <div className="text-[8px] text-[var(--color-text-hint)]/70">
                    {dayun.start_year}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
