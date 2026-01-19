'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface WuxingData {
  element: string;
  value: number;
  fullMark: number;
}

interface WuxingRadarProps {
  data?: WuxingData[];
}

const WUXING_COLORS: Record<string, string> = {
  '木': 'var(--wuxing-wood)',
  '火': 'var(--wuxing-fire)',
  '土': 'var(--wuxing-earth)',
  '金': 'var(--wuxing-metal)',
  '水': 'var(--wuxing-water)',
};

const defaultData: WuxingData[] = [
  { element: '木', value: 20, fullMark: 100 },
  { element: '火', value: 35, fullMark: 100 },
  { element: '土', value: 25, fullMark: 100 },
  { element: '金', value: 15, fullMark: 100 },
  { element: '水', value: 30, fullMark: 100 },
];

export default function WuxingRadar({ data = defaultData }: WuxingRadarProps) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid
            stroke="var(--color-border)"
            strokeOpacity={0.5}
          />
          <PolarAngleAxis
            dataKey="element"
            tick={({ x, y, payload }) => {
              const color = WUXING_COLORS[payload.value] || 'var(--color-text-secondary)';
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fill={color}
                  fontSize={14}
                  fontWeight={600}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="五行分布"
            dataKey="value"
            stroke="var(--color-gold)"
            fill="var(--color-gold)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
            }}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
