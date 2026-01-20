'use client';

import { ReactNode } from 'react';
import { WuxingRadar, DayunTimeline, MetricCard } from '@/app/components/charts';
import { PillarCard } from '@/app/components/cultural';

interface Pillar {
  gan: string;
  zhi: string;
  gan_wuxing: string;
  zhi_wuxing: string;
}

interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
}

interface DayunItem {
  age_start: number;
  age_end: number;
  ganzhi: string;
  start_year: number;
  end_year: number;
}

interface Paipan {
  four_pillars: FourPillars;
  dayun?: DayunItem[];
  wuxing_count?: Record<string, number>;
  day_master?: string;
  day_master_strength?: string;
}

interface DashboardProps {
  paipan: Paipan | null;
  currentAge?: number;
  children?: ReactNode;
}

export default function Dashboard({ paipan, currentAge = 30, children }: DashboardProps) {
  if (!paipan) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-2xl">
          🔮
        </div>
        <p className="text-[var(--color-text-secondary)]">请先完成排盘以查看命盘数据</p>
      </div>
    );
  }

  const { four_pillars, dayun, wuxing_count, day_master, day_master_strength } = paipan;

  const wuxingData = wuxing_count
    ? Object.entries(wuxing_count).map(([element, value]) => ({
        element,
        value: Math.round((value / Object.values(wuxing_count).reduce((a, b) => a + b, 0)) * 100),
        fullMark: 100,
      }))
    : [
        { element: '木', value: 20, fullMark: 100 },
        { element: '火', value: 25, fullMark: 100 },
        { element: '土', value: 20, fullMark: 100 },
        { element: '金', value: 15, fullMark: 100 },
        { element: '水', value: 20, fullMark: 100 },
      ];

  return (
    <div className="space-y-6">
      {/* 四柱命盘 */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-[var(--color-gold)] mb-4">四柱命盘</h3>
        <div className="grid grid-cols-4 gap-3">
          <PillarCard pillar={four_pillars.year} label="年柱" />
          <PillarCard pillar={four_pillars.month} label="月柱" />
          <PillarCard pillar={four_pillars.day} label="日柱" highlight />
          <PillarCard pillar={four_pillars.hour} label="时柱" />
        </div>
      </div>

      {/* 指标卡片 + 五行雷达图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <MetricCard
            title="日主"
            value={day_master || four_pillars.day.gan}
            subtitle={`${four_pillars.day.gan_wuxing}日元`}
            color={four_pillars.day.gan_wuxing as 'wood' | 'fire' | 'earth' | 'metal' | 'water'}
          />
          <MetricCard
            title="日主强弱"
            value={day_master_strength || '待分析'}
            subtitle="根据月令及生克关系判断"
            color="gold"
          />
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-[var(--color-gold)] mb-2">五行分布</h3>
          <WuxingRadar data={wuxingData} />
        </div>
      </div>

      {/* 大运时间轴 */}
      {dayun && dayun.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-medium text-[var(--color-gold)] mb-4">大运流年</h3>
          <DayunTimeline data={dayun} currentAge={currentAge} />
        </div>
      )}

      {children}
    </div>
  );
}
