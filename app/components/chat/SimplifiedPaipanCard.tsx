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
  { name: '年', ganBg: 'bg-emerald-50', zhiBg: 'bg-emerald-50/60', border: 'border-emerald-200', labelColor: 'text-emerald-700' },
  { name: '月', ganBg: 'bg-red-50',     zhiBg: 'bg-red-50/60',     border: 'border-red-200',     labelColor: 'text-red-700' },
  { name: '日', ganBg: 'bg-amber-50',   zhiBg: 'bg-amber-50/60',   border: 'border-amber-200',   labelColor: 'text-amber-700' },
  { name: '时', ganBg: 'bg-sky-50',     zhiBg: 'bg-sky-50/60',     border: 'border-sky-200',     labelColor: 'text-sky-700' },
];

function WuxingBadge({ char, lookup }: { char: string; lookup: Record<string, string> }) {
  const element = lookup[char];
  if (!element) return null;
  const cls = WUXING_CLASS[element] ?? '';
  return (
    <span className={`inline-block text-[9px] px-1 py-0 rounded-full border mt-1 leading-4 ${cls}`}>
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
              {/* 柱名 + 日主标记 */}
              <div className="flex items-center gap-1 mb-1.5">
                <span className={`text-[10px] font-medium ${style.labelColor}`}>{style.name}</span>
                {isDay && (
                  <span className="text-[8px] px-1 rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold-dark)] border border-[var(--color-gold)]/30 leading-4">
                    日主
                  </span>
                )}
              </div>

              {/* 卡片：天干 + 分隔 + 地支 */}
              <div className={`w-full rounded-lg border ${style.border} ${isDay ? 'ring-1 ring-[var(--color-gold)]/40' : ''} overflow-hidden`}>
                {/* 天干 */}
                <div className={`${style.ganBg} px-1 py-2 text-center flex flex-col items-center`}>
                  <span className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                    {gan || '—'}
                  </span>
                  <WuxingBadge char={gan ?? ''} lookup={TIANGAN_WUXING} />
                </div>

                {/* 虚线分隔 */}
                <div className={`border-t border-dashed ${style.border}`} />

                {/* 地支 */}
                <div className={`${style.zhiBg} px-1 py-2 text-center flex flex-col items-center`}>
                  <span className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                    {zhi || '—'}
                  </span>
                  <WuxingBadge char={zhi ?? ''} lookup={DIZHI_WUXING} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 大运 */}
      {dayunList.length > 0 && (
        <div className="mt-auto border-t border-[var(--color-border-subtle)] px-3 sm:px-4 pt-3 pb-3">
          <div className="text-[10px] text-[var(--color-text-muted)] mb-2 font-medium tracking-wide">大运</div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {dayunList.map((dayun, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center flex-shrink-0 min-w-[48px] sm:min-w-[56px] rounded-lg border px-2 py-2 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg)] ${
                  idx === 0
                    ? 'border-[var(--color-primary)]/40 shadow-sm shadow-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)]'
                }`}
              >
                <div className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                  {dayun.pillar?.[0]}{dayun.pillar?.[1]}
                </div>
                <div className="text-[9px] text-[var(--color-text-hint)] mt-0.5">
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
