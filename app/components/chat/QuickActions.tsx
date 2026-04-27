'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export function QuickActions({
  disabled,
  buttons,
  onClick,
}: {
  disabled: boolean;
  buttons: Array<{ label: string; prompt: string }>;
  onClick: (label: string, prompt: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      {/* 标题栏 - 移动端可点击折叠 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 sm:cursor-default"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-gold)] flex-shrink-0" />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">快捷分析</span>
        </div>
        {/* 折叠图标 - 仅移动端显示 */}
        <div className="sm:hidden">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
        </div>
      </button>

      {/* 按钮区域 - 移动端可折叠，桌面端始终显示 */}
      <div
        className={`px-4 pb-3 transition-all duration-200 ${
          isExpanded ? 'block' : 'hidden'
        } sm:block`}
      >
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
    </div>
  );
}
