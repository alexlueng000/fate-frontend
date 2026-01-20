'use client';

import { useState } from 'react';

interface DayunItem {
  age_start: number;
  age_end: number;
  ganzhi: string;
  start_year: number;
  end_year: number;
}

interface DayunTimelineProps {
  data: DayunItem[];
  currentAge?: number;
}

export default function DayunTimeline({ data, currentAge = 0 }: DayunTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getCurrentIndex = () => {
    return data.findIndex((d) => currentAge >= d.age_start && currentAge <= d.age_end);
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {data.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;
          const isHovered = index === hoveredIndex;

          return (
            <div
              key={index}
              className="relative flex-shrink-0"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`
                  px-3 py-2 rounded-lg text-center cursor-pointer transition-all
                  ${isCurrent ? 'bg-[var(--color-primary)] text-white shadow-lg scale-105' : ''}
                  ${isPast && !isCurrent ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]' : ''}
                  ${!isPast && !isCurrent ? 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]' : ''}
                `}
              >
                <div className="text-lg font-bold font-serif">{item.ganzhi}</div>
                <div className="text-xs opacity-70">{item.age_start}-{item.age_end}岁</div>
              </div>

              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
                  <div className="text-sm font-medium text-[var(--color-gold)]">{item.ganzhi}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {item.start_year} - {item.end_year}年
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {item.age_start} - {item.age_end}岁
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[var(--color-primary)]" />
          <span>当前大运</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[var(--color-bg-elevated)]" />
          <span>已过</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[var(--color-bg-card)]" />
          <span>未来</span>
        </div>
      </div>
    </div>
  );
}
