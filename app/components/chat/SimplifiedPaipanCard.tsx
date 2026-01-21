'use client';

import { Paipan } from '@/app/lib/chat/types';

interface SimplifiedPaipanCardProps {
  paipan: Paipan;
}

/**
 * 简化版命盘卡片 - 仅展示四柱八字，无五行标签和大运
 * 移动端优先的 2x2 网格布局
 */
export function SimplifiedPaipanCard({ paipan }: SimplifiedPaipanCardProps) {
  const pillars = [
    { name: '年柱', gan: paipan.four_pillars.year?.[0], zhi: paipan.four_pillars.year?.[1] },
    { name: '月柱', gan: paipan.four_pillars.month?.[0], zhi: paipan.four_pillars.month?.[1] },
    { name: '日柱', gan: paipan.four_pillars.day?.[0], zhi: paipan.four_pillars.day?.[1] },
    { name: '时柱', gan: paipan.four_pillars.hour?.[0], zhi: paipan.four_pillars.hour?.[1] },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          四柱八字
        </h3>
        <span className="text-xs text-[var(--color-text-hint)]">
          您的命盘
        </span>
      </div>

      {/* 2x2 网格展示四柱 */}
      <div className="grid grid-cols-2 gap-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="rounded-xl bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg)] border border-[var(--color-border)] p-4 text-center transition-all hover:shadow-md"
          >
            <div className="text-xs text-[var(--color-text-muted)] mb-2">
              {pillar.name}
            </div>
            <div className="text-2xl font-bold text-[var(--color-primary)]">
              {pillar.gan}{pillar.zhi}
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
        <p className="text-xs text-[var(--color-text-hint)] text-center">
          完成排盘后，AI 将为您解读命理
        </p>
      </div>
    </div>
  );
}
