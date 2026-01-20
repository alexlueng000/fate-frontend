'use client';

import { wuxingMap, WuxingElement } from '@/app/lib/design-tokens';

interface Pillar {
  gan: string;
  zhi: string;
  gan_wuxing: string;
  zhi_wuxing: string;
}

interface PillarCardProps {
  pillar: Pillar;
  label: string;
  highlight?: boolean;
}

export default function PillarCard({ pillar, label, highlight }: PillarCardProps) {
  const ganWuxing = pillar.gan_wuxing as WuxingElement;
  const zhiWuxing = pillar.zhi_wuxing as WuxingElement;
  const ganColor = wuxingMap[ganWuxing]?.color || 'var(--color-text-primary)';
  const zhiColor = wuxingMap[zhiWuxing]?.color || 'var(--color-text-primary)';

  return (
    <div
      className={`
        flex flex-col items-center p-3 rounded-xl transition-all
        ${highlight ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30' : 'bg-[var(--color-bg-elevated)]'}
      `}
    >
      <span className="text-xs text-[var(--color-text-muted)] mb-2">{label}</span>

      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold font-serif" style={{ color: ganColor }}>
            {pillar.gan}
          </span>
          <span className="text-xs" style={{ color: ganColor, opacity: 0.7 }}>
            {pillar.gan_wuxing}
          </span>
        </div>

        <div className="w-6 h-px bg-[var(--color-border)] my-1" />

        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold font-serif" style={{ color: zhiColor }}>
            {pillar.zhi}
          </span>
          <span className="text-xs" style={{ color: zhiColor, opacity: 0.7 }}>
            {pillar.zhi_wuxing}
          </span>
        </div>
      </div>
    </div>
  );
}
