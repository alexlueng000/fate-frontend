'use client';

import { Sparkles } from 'lucide-react';

export function QuickActions({
  disabled,
  buttons,
  onClick,
}: {
  disabled: boolean;
  buttons: Array<{ label: string; prompt: string }>;
  onClick: (label: string, prompt: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">快捷分析</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={disabled}
            onClick={() => onClick(b.label, b.prompt)}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-gold-dark)] hover:text-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title={`快速生成：${b.label}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
