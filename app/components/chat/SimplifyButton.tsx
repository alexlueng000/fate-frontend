'use client';

type SimplifyStatus = 'idle' | 'loading' | 'done' | 'error';

interface Props {
  status: SimplifyStatus;
  expanded: boolean;
  onToggle: () => void;
  onRequest: () => void;
}

export function SimplifyButton({ status, expanded, onToggle, onRequest }: Props) {
  if (status === 'idle') {
    return (
      <button
        onClick={onRequest}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-all"
        title="生成白话版"
      >
        <span>📖</span>
        <span>白话版</span>
      </button>
    );
  }

  if (status === 'loading') {
    return (
      <button
        disabled
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--color-text-muted)] opacity-60 cursor-not-allowed"
      >
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-text-muted)] border-t-[var(--color-gold)]" />
        <span>转化中…</span>
      </button>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={onRequest}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-all"
        title="点击重试"
      >
        <span>⚠️</span>
        <span>重试</span>
      </button>
    );
  }

  // done — toggle expand/collapse
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
        expanded
          ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/10'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10'
      }`}
      title={expanded ? '收起白话版' : '展开白话版'}
    >
      <span>📖</span>
      <span>白话版</span>
    </button>
  );
}
