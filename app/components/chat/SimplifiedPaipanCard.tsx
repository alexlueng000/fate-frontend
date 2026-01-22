'use client';

import { Paipan } from '@/app/lib/chat/types';

interface SimplifiedPaipanCardProps {
  paipan: Paipan;
}

/**
 * 简化版命盘卡片 - 展示四柱八字和大运
 * 响应式单行紧凑布局，带色彩优化
 */
export function SimplifiedPaipanCard({ paipan }: SimplifiedPaipanCardProps) {
  const pillars = [
    { name: '年', gan: paipan.four_pillars.year?.[0], zhi: paipan.four_pillars.year?.[1], color: 'from-emerald-500/20 to-emerald-600/10' },
    { name: '月', gan: paipan.four_pillars.month?.[0], zhi: paipan.four_pillars.month?.[1], color: 'from-red-500/20 to-red-600/10' },
    { name: '日', gan: paipan.four_pillars.day?.[0], zhi: paipan.four_pillars.day?.[1], color: 'from-amber-500/20 to-amber-600/10' },
    { name: '时', gan: paipan.four_pillars.hour?.[0], zhi: paipan.four_pillars.hour?.[1], color: 'from-sky-500/20 to-sky-600/10' },
  ];

  // 取前5个大运
  const dayunList = paipan.dayun?.slice(0, 5) || [];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 sm:p-4 shadow-sm h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
          四柱八字
        </h3>
        <span className="text-[9px] sm:text-[10px] text-[var(--color-text-hint)]">
          您的命盘
        </span>
      </div>

      {/* 单行展示四柱 - 响应式 */}
      <div className="flex gap-2 sm:gap-3 justify-center mb-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="flex flex-col items-center flex-1"
          >
            <div className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mb-1">
              {pillar.name}
            </div>
            <div className={`w-full rounded-lg bg-gradient-to-br ${pillar.color} border border-[var(--color-border)] px-2 py-3 text-center`}>
              <div className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                {pillar.gan}{pillar.zhi}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 大运信息 */}
      {dayunList.length > 0 && (
        <div className="mt-auto pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mb-2 font-medium">大运</div>
          <div className="flex gap-1.5 sm:gap-2 justify-start overflow-x-auto pb-1">
            {dayunList.map((dayun, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center min-w-[44px] sm:min-w-[52px] flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg)] border border-[var(--color-border)] px-2 py-2"
              >
                <div className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                  {dayun.pillar?.[0]}{dayun.pillar?.[1]}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[var(--color-text-hint)] mt-1">
                  {dayun.age}岁
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
