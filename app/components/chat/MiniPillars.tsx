'use client';

const TIANGAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

const DIZHI_WUXING: Record<string, string> = {
  寅: '木', 卯: '木', 巳: '火', 午: '火',
  丑: '土', 辰: '土', 未: '土', 戌: '土',
  申: '金', 酉: '金', 亥: '水', 子: '水',
};

const WUXING_TEXT: Record<string, string> = {
  木: 'text-[var(--color-wuxing-wood)]',
  火: 'text-[var(--color-wuxing-fire)]',
  土: 'text-[var(--color-wuxing-earth)]',
  金: 'text-[var(--color-wuxing-metal)]',
  水: 'text-[var(--color-wuxing-water)]',
};

interface FourPillars {
  year?: string[];
  month?: string[];
  day?: string[];
  hour?: string[];
}

interface MiniPillarsProps {
  fourPillars?: FourPillars | null;
  loading?: boolean;
}

const PILLAR_LABELS = ['年柱', '月柱', '日主', '时柱'] as const;

function ganColor(c?: string) {
  if (!c) return '';
  return WUXING_TEXT[TIANGAN_WUXING[c]] ?? '';
}
function zhiColor(c?: string) {
  if (!c) return '';
  return WUXING_TEXT[DIZHI_WUXING[c]] ?? '';
}

export function MiniPillars({ fourPillars, loading }: MiniPillarsProps) {
  const pillars = [
    { gan: fourPillars?.year?.[0],  zhi: fourPillars?.year?.[1] },
    { gan: fourPillars?.month?.[0], zhi: fourPillars?.month?.[1] },
    { gan: fourPillars?.day?.[0],   zhi: fourPillars?.day?.[1] },
    { gan: fourPillars?.hour?.[0],  zhi: fourPillars?.hour?.[1] },
  ];

  return (
    <div className="flex items-stretch gap-2">
      {PILLAR_LABELS.map((label, i) => {
        const { gan, zhi } = pillars[i];
        const isDay = i === 2;
        const showSkeleton = loading && !gan && !zhi;
        return (
          <div
            key={label}
            className={`relative flex flex-col items-center justify-center min-w-[44px] sm:min-w-[52px] px-2 py-1.5 rounded-[4px] border transition-colors ${
              isDay
                ? 'border-[var(--color-gold)]/60 bg-[var(--color-gold)]/8 ring-1 ring-[var(--color-gold)]/30'
                : 'border-[var(--color-border)] bg-white hover:border-[var(--color-border-accent)]'
            }`}
            title={`${label} ${gan ?? ''}${zhi ?? ''}`}
          >
            <span
              className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1 text-[9px] leading-none tracking-wide rounded bg-[var(--color-bg)] ${
                isDay ? 'text-[var(--color-gold-dark)] font-semibold' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {label}
            </span>
            {showSkeleton ? (
              <div className="flex flex-col items-center gap-1 py-0.5">
                <div className="w-4 h-3 rounded bg-[var(--color-border)]/60 animate-pulse" />
                <div className="w-4 h-3 rounded bg-[var(--color-border)]/60 animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-col items-center leading-tight">
                <span className={`text-base sm:text-[17px] font-semibold ${ganColor(gan)}`}>
                  {gan || '—'}
                </span>
                <span className={`text-base sm:text-[17px] font-semibold ${zhiColor(zhi)}`}>
                  {zhi || '—'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
