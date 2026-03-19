'use client';

import { ComponentType } from 'react';

interface Props {
  status: 'idle' | 'loading' | 'done' | 'error';
  content: string;
  expanded: boolean;
  error?: string;
  Markdown: ComponentType<{ content: string }>;
}

export function SimplifyPanel({ status, content, expanded, error, Markdown }: Props) {
  if (!expanded) return null;

  return (
    <div className="mt-2 rounded-xl border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--color-gold)]/20">
        <span className="text-xs font-medium text-[var(--color-gold)]">白话版</span>
      </div>
      <div className="px-3 py-2">
        {status === 'loading' && !content && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-text-muted)] border-t-[var(--color-gold)]" />
            <span>正在生成白话版…</span>
          </div>
        )}
        {status === 'error' && !content && (
          <p className="text-sm text-red-500">{error || '生成失败，请重试'}</p>
        )}
        {content && (
          <div className="msg-md text-sm">
            <Markdown content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
