"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  id: string;
  title: string;
  subtitle: string;
  painPoints: string[];
  solution: { intro: string; points: string[] };
  value: string;
  visual: React.ReactNode;
  ctaText: string;
  ctaLink: string;
  /** 仅用于 subtitle 的功能识别字色，不再用作背景。 */
  themeColor: string;
  /** Deprecated: themeBg 大色块违反 Restrained 策略，不再使用。 */
  themeBg?: string;
  reversed?: boolean;
}

export default function FeatureCard({
  id,
  title,
  subtitle,
  painPoints,
  solution,
  value,
  visual,
  ctaText,
  ctaLink,
  themeColor,
  reversed = false,
}: FeatureCardProps) {
  const textContent = (
    <div className="flex flex-col justify-center gap-7">
      {/* 标题 */}
      <header className="space-y-2">
        <h3
          className="text-[1.625rem] md:text-[1.75rem] lg:text-[2rem] font-medium leading-[1.25] text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <p
          className="text-[0.9375rem] font-medium tracking-wide"
          style={{ color: themeColor, fontFamily: "var(--font-body)" }}
        >
          {subtitle}
        </p>
      </header>

      {/* 痛点 · 用户原话 */}
      <ul className="flex flex-col gap-1.5">
        {painPoints.map((p) => (
          <li
            key={p}
            className="text-[0.9375rem] text-[var(--color-text-secondary)] leading-relaxed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {p}
          </li>
        ))}
      </ul>

      {/* 解决方案 */}
      <div className="space-y-2">
        <p className="text-[1rem] text-[var(--color-text-body)] leading-relaxed">
          {solution.intro}
        </p>
        <ul className="space-y-1.5 pl-0">
          {solution.points.map((pt, idx) => (
            <li
              key={pt}
              className="grid grid-cols-[auto_1fr] items-baseline gap-3 text-[0.9375rem] text-[var(--color-text-body)] leading-relaxed"
            >
              <span
                className="font-mono text-[0.75rem] text-[var(--color-text-hint)] tabular-nums"
                aria-hidden="true"
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 价值主张 · 编辑型注脚 */}
      <p
        className="text-[0.9375rem] text-[var(--color-text-secondary)] leading-relaxed"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>

      {/* CTA */}
      <div>
        <Link href={ctaLink} className="btn btn-primary group">
          {ctaText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );

  const visualContent = (
    <div
      className="card flex items-center justify-center p-6 md:p-8"
      style={{ minHeight: "320px" }}
    >
      {visual}
    </div>
  );

  return (
    <div
      id={id}
      className="grid items-center gap-10 md:gap-14 lg:gap-20 md:grid-cols-2"
    >
      {reversed ? (
        <>
          <div className="md:order-1">{visualContent}</div>
          <div className="md:order-2">{textContent}</div>
        </>
      ) : (
        <>
          {textContent}
          {visualContent}
        </>
      )}
    </div>
  );
}
