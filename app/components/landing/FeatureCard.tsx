'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
  themeColor: string;
  themeBg: string;
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
  themeBg,
  reversed = false,
}: FeatureCardProps) {
  const textContent = (
    <div className="space-y-6 flex flex-col justify-center">
      {/* 标题 */}
      <div>
        <h3
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {title}
        </h3>
        <p className="text-lg font-medium" style={{ color: themeColor }}>
          {subtitle}
        </p>
      </div>

      {/* 痛点 */}
      <div className="space-y-2">
        {painPoints.map((p) => (
          <p key={p} className="text-[var(--color-text-secondary)] text-sm italic">
            "{p}"
          </p>
        ))}
      </div>

      {/* 解决方案 */}
      <div>
        <p className="text-[var(--color-text-secondary)] mb-3">{solution.intro}</p>
        <ul className="space-y-1.5">
          {solution.points.map((pt) => (
            <li key={pt} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="mt-0.5 flex-shrink-0" style={{ color: themeColor }}>•</span>
              {pt}
            </li>
          ))}
        </ul>
      </div>

      {/* 价值主张 */}
      <p className="text-sm text-[var(--color-text-muted)] border-l-2 pl-3" style={{ borderColor: themeColor }}>
        {value}
      </p>

      {/* CTA */}
      <Link
        href={ctaLink}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm group w-fit transition-all hover:-translate-y-0.5"
        style={{ background: themeColor, color: 'white' }}
      >
        {ctaText}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );

  const visualContent = (
    <div
      className="rounded-2xl p-6 shadow-md border border-[var(--color-border)]"
      style={{ background: themeBg }}
    >
      {visual}
    </div>
  );

  return (
    <div id={id} className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      {reversed ? (
        <>
          {visualContent}
          {textContent}
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
