'use client';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const SCORES = [62, 48, 71, 55, 80, 88, 74];
const EMOTIONS = ['平静', '焦虑', '愉悦', '疲惫', '充实', '放松', '满足'];
const TAGS = ['工作压力', '家庭温暖', '创意灵感', '身体疲惫', '期待', '感恩'];

const MAX = 100;
const W = 280;
const H = 120;
const PAD = 16;

export default function EmotionChart() {
  const xs = SCORES.map((_, i) => PAD + (i / (SCORES.length - 1)) * (W - PAD * 2));
  const ys = SCORES.map((s) => H - PAD - (s / MAX) * (H - PAD * 2));

  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const areaD = `${pathD} L${xs[xs.length - 1]},${H - PAD} L${xs[0]},${H - PAD} Z`;

  return (
    <div className="space-y-4">
      <div className="text-xs text-[var(--color-text-muted)] text-center mb-2">本周情绪曲线（示例）</div>

      {/* 折线图 */}
      <div className="bg-[var(--color-bg-deep)] rounded-xl p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* 横向网格线 */}
          {[25, 50, 75].map((y) => (
            <line
              key={y}
              x1={PAD} y1={H - PAD - (y / MAX) * (H - PAD * 2)}
              x2={W - PAD} y2={H - PAD - (y / MAX) * (H - PAD * 2)}
              stroke="rgba(167,179,174,0.3)" strokeWidth="1" strokeDasharray="4 3"
            />
          ))}
          {/* 面积 */}
          <path d={areaD} fill="rgba(167,179,174,0.15)" />
          {/* 折线 */}
          <path d={pathD} fill="none" stroke="var(--color-mist-deep)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* 数据点 */}
          {xs.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={ys[i]} r={4} fill="var(--color-mist-deep)" />
              <circle cx={x} cy={ys[i]} r={2} fill="white" />
            </g>
          ))}
          {/* X 轴标签 */}
          {xs.map((x, i) => (
            <text key={i} x={x} y={H - 2} textAnchor="middle" fontSize="8" fill="#9B9087">
              {DAYS[i]}
            </text>
          ))}
        </svg>
      </div>

      {/* 今日情绪 */}
      <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-deep)] rounded-xl">
        <div className="w-10 h-10 rounded-full bg-[var(--color-mist-light)] flex items-center justify-center text-2xl">
          😌
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--color-text-primary)]">今日状态：满足</div>
          <div className="text-xs text-[var(--color-text-muted)]">情绪指数 74 · 高于本周均值</div>
        </div>
      </div>

      {/* 情绪标签云 */}
      <div className="flex flex-wrap gap-1.5">
        {TAGS.map((tag, i) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              background: i % 2 === 0 ? 'rgba(167,179,174,0.2)' : 'var(--color-bg-deep)',
              color: 'var(--color-mist-deep)',
              border: '1px solid rgba(167,179,174,0.3)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
