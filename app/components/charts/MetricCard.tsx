'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'gold' | 'tech' | 'wood' | 'fire' | 'earth' | 'metal' | 'water';
}

const colorMap = {
  primary: 'var(--color-primary)',
  gold: 'var(--color-gold)',
  tech: 'var(--color-tech)',
  wood: 'var(--wuxing-wood)',
  fire: 'var(--wuxing-fire)',
  earth: 'var(--wuxing-earth)',
  metal: 'var(--wuxing-metal)',
  water: 'var(--wuxing-water)',
};

export default function MetricCard({ title, value, subtitle, icon, trend, color = 'gold' }: MetricCardProps) {
  const accentColor = colorMap[color];

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">{title}</span>
        {icon && <span style={{ color: accentColor }}>{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-serif" style={{ color: accentColor }}>
          {value}
        </span>
        {trend && (
          <span className={`text-sm ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-xs text-[var(--color-text-hint)]">{subtitle}</span>
      )}
    </div>
  );
}
