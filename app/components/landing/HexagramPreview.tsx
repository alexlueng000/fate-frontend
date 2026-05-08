"use client";

import { useEffect, useState } from "react";

const BEN_GUA = [1, 1, 0, 1, 1, 1];
const BIAN_GUA = [1, 1, 0, 0, 1, 1];

const GUA_BEN = { name: "风火家人", note: "本卦" };
const GUA_BIAN = { name: "天火同人", note: "变卦" };

const MOVING_LINE_INDEX = 3;

function Yao({ yang, moving, revealed }: { yang: boolean; moving?: boolean; revealed: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-1 transition-all duration-500 ${
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      {yang ? (
        <div
          className="h-[6px] w-full"
          style={{
            background: "currentColor",
            opacity: moving ? 0.7 : 1,
          }}
        />
      ) : (
        <div className="flex w-full gap-2">
          <div className="flex-1 h-[6px]" style={{ background: "currentColor" }} />
          <div className="flex-1 h-[6px]" style={{ background: "currentColor" }} />
        </div>
      )}
    </div>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function HexagramPreview() {
  const [phase, setPhase] = useState<"ben" | "bian">("ben");
  const [revealedCount, setRevealedCount] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setRevealedCount(6);
      return;
    }
    setRevealedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 6; i++) {
      timers.push(setTimeout(() => setRevealedCount(i + 1), i * 150 + 200));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, reduced]);

  const gua = phase === "ben" ? BEN_GUA : BIAN_GUA;
  const meta = phase === "ben" ? GUA_BEN : GUA_BIAN;
  const accent =
    phase === "ben"
      ? "var(--color-gold-dark)"
      : "var(--color-mist-deep)";

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)] text-center">
        卦象演示
      </div>

      {/* 卦象本体 */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-28 space-y-2.5 p-3 transition-colors duration-500"
          style={{
            color: accent,
            background: "color-mix(in oklch, currentColor 7%, var(--color-bg-elevated))",
            borderRadius: "var(--radius-md)",
          }}
          role="presentation"
          aria-label={`${meta.name}`}
        >
          {[...gua].reverse().map((yang, i) => (
            <Yao
              key={i}
              yang={yang === 1}
              moving={phase === "ben" && 5 - i === MOVING_LINE_INDEX}
              revealed={revealedCount > i}
            />
          ))}
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className="text-[1.25rem] font-medium"
            style={{ fontFamily: "var(--font-display)", color: accent }}
          >
            {meta.name}
          </span>
          <span className="text-[0.75rem] text-[var(--color-text-hint)]">{meta.note}</span>
        </div>

        {/* 切换按钮 · 替代自动切换 */}
        <button
          type="button"
          onClick={() => setPhase((p) => (p === "ben" ? "bian" : "ben"))}
          className="btn btn-ghost text-[0.8125rem]"
          style={{ minHeight: "36px", padding: "0.4rem 0.875rem" }}
        >
          {phase === "ben" ? "查看变卦 →" : "← 回到本卦"}
        </button>
      </div>

      {/* 解读摘要 · 编辑型 */}
      <section
        className="border-t border-[var(--color-border)] pt-4 space-y-2"
      >
        <div className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {phase === "ben" ? "卦象分析" : "变卦提示"}
        </div>
        <p
          className="text-[0.9375rem] text-[var(--color-text-body)] leading-relaxed"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {phase === "ben"
            ? "此卦主家，问事以内部协调为先，宜稳不宜急。第四爻动，需关注关键变数。"
            : "变为天火同人，格局开阔，原有阻碍趋于化解，合作与沟通将带来转机。"}
        </p>
      </section>

      {/* 行动建议 · 排版式 */}
      <ul className="grid grid-cols-3 gap-1.5 text-center text-[0.75rem]">
        {["趋势向好", "三至七日", "主动沟通"].map((tag) => (
          <li
            key={tag}
            className="py-1.5"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-gold-dark)",
              border: "1px solid color-mix(in oklch, var(--color-gold-dark) 22%, transparent)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}
