"use client";

interface ScenarioCardProps {
  persona: string;
  role: string;
  scenario: string;
  features: string[];
  tags: string[];
  /** Deprecated: kept for backward compatibility, no longer used. */
  accentColor?: string;
}

export default function ScenarioCard({
  persona,
  role,
  scenario,
  features,
  tags,
}: ScenarioCardProps) {
  return (
    <article className="card card-hover relative flex flex-col gap-5 p-6 md:p-7">
      {/* 引语本体 · 思源宋体 · 阅读型 */}
      <blockquote
        className="text-[var(--color-text-body)] leading-[1.75] text-[1rem] md:text-[1.0625rem]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {scenario}
      </blockquote>

      {/* 署名 */}
      <footer className="flex flex-col gap-2 pt-1">
        <div className="text-[0.9375rem] font-medium text-[var(--color-text-primary)]">
          {persona}
          <span className="ml-2 text-[var(--color-text-muted)] font-normal">{role}</span>
        </div>

        {/* 关联功能 · 排版式标记，不用色块 */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-hint)]">基于</span>
          {features.map((f, i) => (
            <span key={f} className="text-[var(--color-text-secondary)]">
              {f}
              {i < features.length - 1 && <span className="ml-2 text-[var(--color-text-hint)]">·</span>}
            </span>
          ))}
          {tags.length > 0 && (
            <>
              <span className="mx-1 h-3 w-px bg-[var(--color-border-strong)]" aria-hidden="true" />
              {tags.map((t) => (
                <span key={t} className="text-[var(--color-text-muted)]">
                  {t}
                </span>
              ))}
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
