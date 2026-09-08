"use client";

import MotionScene, { motionDelay } from "@/app/components/landing/MotionScene";

const PILLARS = [
  { label: "YEAR",  zh: "年柱", tian: "甲", di: "子", tian_wx: "wood",  di_wx: "water" },
  { label: "MONTH", zh: "月柱", tian: "丁", di: "卯", tian_wx: "fire",  di_wx: "wood"  },
  { label: "DAY",   zh: "日柱", tian: "庚", di: "午", tian_wx: "metal", di_wx: "fire"  },
  { label: "HOUR",  zh: "时柱", tian: "壬", di: "戌", tian_wx: "water", di_wx: "earth" },
] as const;

type Wuxing = "wood" | "fire" | "earth" | "metal" | "water";

const WX_VAR: Record<Wuxing, string> = {
  wood:  "var(--color-wuxing-wood)",
  fire:  "var(--color-wuxing-fire)",
  earth: "var(--color-wuxing-earth)",
  metal: "var(--color-wuxing-metal)",
  water: "var(--color-wuxing-water)",
};

const wxBg = (wx: Wuxing) =>
  `color-mix(in oklch, ${WX_VAR[wx]} 8%, var(--color-bg-elevated))`;

export default function BaziPreview() {
  return (
    <MotionScene className="w-full max-w-md space-y-5">
      <div className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)] text-center">
        示例命盘
      </div>

      {/* 四柱表格 · 编辑型 */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {PILLARS.map((p) => (
              <th
                key={p.label}
                className="border-b border-[var(--color-border)] pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                scope="col"
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {PILLARS.map((p, index) => (
              <td
                key={p.label + "-tian"}
                className="border-r border-[var(--color-border)] py-3 text-center last:border-r-0"
                style={{ background: wxBg(p.tian_wx as Wuxing) }}
              >
                <span
                  data-reveal
                  className="inline-block text-[1.625rem] font-medium leading-none"
                  style={{ ...motionDelay(index * 120), fontFamily: "var(--font-display)", color: WX_VAR[p.tian_wx as Wuxing] }}
                >
                  {p.tian}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            {PILLARS.map((p, index) => (
              <td
                key={p.label + "-di"}
                className="border-r border-t border-[var(--color-border)] py-2.5 text-center last:border-r-0"
                style={{ background: wxBg(p.di_wx as Wuxing) }}
              >
                <span
                  data-reveal
                  className="inline-block text-[1.125rem] leading-none"
                  style={{ ...motionDelay(index * 120 + 70), fontFamily: "var(--font-display)", color: WX_VAR[p.di_wx as Wuxing] }}
                >
                  {p.di}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* 大运流年 · 时间轴 */}
      <section data-reveal className="space-y-2" style={motionDelay(500)}>
        <h4 className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          大运流年
        </h4>
        <ol className="grid grid-cols-5 gap-1">
          {["22岁", "32岁", "42岁", "52岁", "62岁"].map((age, i) => {
            const active = i === 1;
            return (
              <li
                key={age}
                className="text-center py-1.5 text-[0.75rem] font-medium border"
                style={{
                  background: active ? "var(--color-primary)" : "var(--color-bg-deep)",
                  color: active ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                  borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {age}
              </li>
            );
          })}
        </ol>
        <p className="text-[0.6875rem] text-[var(--color-text-hint)] text-center">
          当前大运
        </p>
      </section>

      {/* 五行分布 · 排版式条 */}
      <section className="space-y-2">
        <h4 className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          五行分布
        </h4>
        <ul className="space-y-1.5">
          {[
            { label: "木", pct: 25, wx: "wood"  as Wuxing },
            { label: "火", pct: 38, wx: "fire"  as Wuxing },
            { label: "土", pct: 12, wx: "earth" as Wuxing },
            { label: "金", pct: 13, wx: "metal" as Wuxing },
            { label: "水", pct: 12, wx: "water" as Wuxing },
          ].map((it, index) => (
            <li key={it.label} className="grid grid-cols-[1.25rem_1fr_2rem] items-center gap-2">
              <span
                className="text-[0.875rem]"
                style={{ fontFamily: "var(--font-display)", color: WX_VAR[it.wx] }}
              >
                {it.label}
              </span>
              <div
                className="h-[3px] overflow-hidden"
                style={{ background: "var(--color-bg-deep)" }}
              >
                <div
                  data-draw
                  className="h-full"
                  style={{
                    ...motionDelay(800 + index * 90),
                    width: `${it.pct}%`,
                    background: WX_VAR[it.wx],
                  }}
                />
              </div>
              <span className="text-[0.75rem] text-[var(--color-text-hint)] tabular-nums text-right">
                {it.pct}%
              </span>
            </li>
          ))}
        </ul>
      </section>
      <p data-reveal style={motionDelay(1600)} className="border-t border-[var(--color-border)] pt-4 text-[0.875rem] leading-[1.75] text-[var(--color-text-secondary)]">
        先看见自己的倾向，再把它放回生活里慢慢对照。
      </p>
    </MotionScene>
  );
}
