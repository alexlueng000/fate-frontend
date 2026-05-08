"use client";

const DAYS = ["一", "二", "三", "四", "五", "六", "日"];
const SCORES = [62, 48, 71, 55, 80, 88, 74];
const TAGS = ["工作压力", "家庭温暖", "创意灵感", "身体疲惫", "期待", "感恩"];

const MAX = 100;
const W = 320;
const H = 140;
const PAD_X = 18;
const PAD_Y = 24;

export default function EmotionChart() {
  const xs = SCORES.map((_, i) => PAD_X + (i / (SCORES.length - 1)) * (W - PAD_X * 2));
  const ys = SCORES.map((s) => H - PAD_Y - (s / MAX) * (H - PAD_Y * 2));

  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const areaD = `${pathD} L${xs[xs.length - 1]},${H - PAD_Y} L${xs[0]},${H - PAD_Y} Z`;

  const todayScore = SCORES[SCORES.length - 1];
  const avg = Math.round(SCORES.reduce((a, b) => a + b, 0) / SCORES.length);

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)] text-center">
        本周情绪曲线
      </div>

      {/* 折线图 */}
      <div
        className="border border-[var(--color-border)] p-3"
        style={{ background: "var(--color-bg-deep)", borderRadius: "var(--radius-md)" }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="本周情绪指数曲线">
          {/* 横向网格线 */}
          {[25, 50, 75].map((y) => (
            <line
              key={y}
              x1={PAD_X}
              y1={H - PAD_Y - (y / MAX) * (H - PAD_Y * 2)}
              x2={W - PAD_X}
              y2={H - PAD_Y - (y / MAX) * (H - PAD_Y * 2)}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))}

          {/* 面积 */}
          <path d={areaD} fill="color-mix(in oklch, var(--color-mist-deep) 14%, transparent)" />

          {/* 折线 */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-mist-deep)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 数据点 */}
          {xs.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={ys[i]} r={3.5} fill="var(--color-mist-deep)" />
              <circle cx={x} cy={ys[i]} r={1.5} fill="var(--color-bg-elevated)" />
            </g>
          ))}

          {/* X 轴标签 */}
          {xs.map((x, i) => (
            <text
              key={i}
              x={x}
              y={H - 6}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-text-muted)"
              fontFamily="var(--font-display)"
            >
              {DAYS[i]}
            </text>
          ))}
        </svg>
      </div>

      {/* 今日状态 · 排版式 */}
      <section
        className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 border-t border-[var(--color-border)] pt-4"
      >
        <span
          className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
        >
          今日
        </span>
        <span
          className="text-[1rem] font-medium text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          满 · 情绪指数 {todayScore}
        </span>
        <span className="text-[0.75rem] text-[var(--color-text-hint)] tabular-nums">
          周均 {avg}
        </span>
      </section>

      {/* 情绪标签 */}
      <div className="flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 text-[0.75rem]"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-mist-deep)",
              border: "1px solid color-mix(in oklch, var(--color-mist-deep) 20%, transparent)",
              borderRadius: "var(--radius-full)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
