'use client';

import { Paipan } from '@/app/lib/chat/types';

interface SimplifiedPaipanCardProps {
  paipan: Paipan;
}

/**
 * 简化版命盘卡片 - 展示四柱八字和大运
 * 响应式单行紧凑布局
 */
export function SimplifiedPaipanCard({ paipan }: SimplifiedPaipanCardProps) {
  const pillars = [
    { name: '年', gan: paipan.four_pillars.year?.[0], zhi: paipan.four_pillars.year?.[1] },
    { name: '月', gan: paipan.four_pillars.month?.[0], zhi: paipan.four_pillars.month?.[1] },
    { name: '日', gan: paipan.four_pillars.day?.[0], zhi: paipan.four_pillars.day?.[1] },
    { name: '时', gan: paipan.four_pillars.hour?.[0], zhi: paipan.four_pillars.hour?.[1] },
  ];

  // 取前5个大运
  const dayunList = paipan.dayun?.slice(0, 5) || [];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 sm:p-4 shadow-sm">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
          四柱八字
        </h3>
        <span className="text-[9px] sm:text-[10px] text-[var(--color-text-hint)]">
          您的命盘
        </span>
      </div>

      {/* 单行展示四柱 - 响应式 */}
      <div className="flex gap-1.5 sm:gap-3 justify-center mb-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="flex flex-col items-center min-w-[44px] sm:min-w-[52px]"
          >
            <div className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mb-0.5">
              {pillar.name}
            </div>
            <div className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
              {pillar.gan}{pillar.zhi}
            </div>
          </div>
        ))}
      </div>

      {/* 大运信息 */}
      {dayunList.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
          <div className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mb-1.5">大运</div>
          <div className="flex gap-1.5 sm:gap-2.5 justify-start overflow-x-auto pb-1">
            {dayunList.map((dayun, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center min-w-[40px] sm:min-w-[48px] flex-shrink-0"
              >
                <div className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
                  {dayun.pillar?.[0]}{dayun.pillar?.[1]}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[var(--color-text-hint)] mt-0.5">
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
