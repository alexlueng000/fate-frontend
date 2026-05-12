'use client';

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

const PILLARS = [
  { key: 'year',  label: '年柱', latin: 'YEAR' },
  { key: 'month', label: '月柱', latin: 'MONTH' },
  { key: 'day',   label: '日主', latin: 'DAY' },
  { key: 'hour',  label: '时柱', latin: 'HOUR' },
] as const;

export function MiniPillars({ fourPillars, loading }: MiniPillarsProps) {
  const data = [
    { gan: fourPillars?.year?.[0],  zhi: fourPillars?.year?.[1] },
    { gan: fourPillars?.month?.[0], zhi: fourPillars?.month?.[1] },
    { gan: fourPillars?.day?.[0],   zhi: fourPillars?.day?.[1] },
    { gan: fourPillars?.hour?.[0],  zhi: fourPillars?.hour?.[1] },
  ];

  return (
    <div
      className="grid grid-cols-4 divide-x divide-[var(--color-border)]"
      role="group"
      aria-label="四柱命盘"
    >
      {PILLARS.map(({ key, label, latin }, i) => {
        const { gan, zhi } = data[i];
        const isDay = key === 'day';
        const showSkeleton = loading && !gan && !zhi;

        return (
          <div
            key={key}
            className="flex flex-col items-center pt-1 pb-1.5"
            aria-label={`${label} ${gan ?? ''}${zhi ?? ''}`.trim()}
          >
            <span
              className="font-sans text-[10px] font-medium tracking-[0.14em] text-[var(--color-text-muted)] mb-1"
              aria-hidden
            >
              {latin}
            </span>
            {showSkeleton ? (
              <div className="flex flex-col items-center gap-1 py-0.5">
                <div className="w-5 h-5 rounded-[var(--radius-sm)] bg-[var(--color-border)]/50 animate-pulse" />
                <div className="w-5 h-4 rounded-[var(--radius-sm)] bg-[var(--color-border)]/50 animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-col items-center leading-[1.05] font-serif">
                <span
                  className={`text-[1.5rem] sm:text-[1.75rem] font-medium ${
                    isDay
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-primary)]'
                  }`}
                >
                  {gan || '—'}
                </span>
                <span className="mt-0.5 text-[1.0625rem] sm:text-[1.1875rem] font-normal text-[var(--color-text-body)]">
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
