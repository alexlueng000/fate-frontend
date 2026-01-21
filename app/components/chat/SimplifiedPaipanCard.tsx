'use client';

import { Paipan } from '@/app/lib/chat/types';

interface SimplifiedPaipanCardProps {
  paipan: Paipan;
}

/**
 * 简化版命盘卡片 - 仅展示四柱八字，无五行标签和大运
 * 移动端优先的 2x2 网格布局（紧凑版）
 */
export function SimplifiedPaipanCard({ paipan }: SimplifiedPaipanCardProps) {
  const pillars = [
    { name: '年', gan: paipan.four_pillars.year?.[0], zhi: paipan.four_pillars.year?.[1] },
    { name: '月', gan: paipan.four_pillars.month?.[0], zhi: paipan.four_pillars.month?.[1] },
    { name: '日', gan: paipan.four_pillars.day?.[0], zhi: paipan.four_pillars.day?.[1] },
    { name: '时', gan: paipan.four_pillars.hour?.[0], zhi: paipan.four_pillars.hour?.[1] },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 shadow-sm">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          四柱八字
        </h3>
        <span className="text-[10px] text-[var(--color-text-hint)]">
          您的命盘
        </span>
      </div>

      {/* 2x2 网格展示四柱 */}
      <div className="grid grid-cols-2 gap-2">
        {pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="rounded-lg bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg)] border border-[var(--color-border)] p-2.5 text-center transition-all"
          >
            <div className="text-[10px] text-[var(--color-text-muted)] mb-1">
              {pillar.name}
            </div>
            <div className="text-xl font-bold text-[var(--color-primary)]">
              {pillar.gan}{pillar.zhi}
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)]">
        <p className="text-[10px] text-[var(--color-text-hint)] text-center">
          完成排盘后，AI 将为您解读命理
        </p>
      </div>
    </div>
  );
}
