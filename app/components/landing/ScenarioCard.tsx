'use client';

interface ScenarioCardProps {
  persona: string;
  role: string;
  scenario: string;
  features: string[];
  tags: string[];
  accentColor: string;
}

export default function ScenarioCard({
  persona,
  role,
  scenario,
  features,
  tags,
  accentColor,
}: ScenarioCardProps) {
  return (
    <div
      className="relative bg-white rounded-2xl shadow-md border border-[var(--color-border)] overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      {/* 左侧色条 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all duration-300"
        style={{ background: accentColor }}
      />

      <div className="p-6 pl-7">
        {/* 人物信息 */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ background: accentColor }}
          >
            {persona[0]}
          </div>
          <div>
            <div className="font-medium text-[var(--color-text-primary)] text-sm">{persona}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{role}</div>
          </div>
        </div>

        {/* 场景文字 */}
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          "{scenario}"
        </p>

        {/* 使用功能 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {features.map((f) => (
            <span
              key={f}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="text-xs text-[var(--color-text-muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
