'use client';
import { Button as UiButton } from '@/app/components/ui';


import type { ReactNode } from 'react';

export function ChatHeader({
  conversationId,
  onBack,
  backLabel = '返回首页',
  rightExtra,
}: {
  conversationId: string | null;
  onBack: () => void;
  backLabel?: string;
  /** 右侧额外槽位（例如剩余次数 chip）。 */
  rightExtra?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
      <h1 className="font-serif text-2xl font-medium text-[var(--color-text-primary)] shrink-0">对话解读</h1>
      <div className="flex items-center gap-2 text-xs text-neutral-700 min-w-0 flex-wrap justify-end">
        {rightExtra}
        {conversationId ? (
          <span className="hidden sm:inline px-2 py-1 rounded bg-white/70 border border-[var(--color-border)] truncate max-w-[160px]">
            {conversationId}
          </span>
        ) : (
          <span className="hidden sm:inline text-neutral-500">正在建立会话…</span>
        )}
        <UiButton variant="plain"
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-full border border-[var(--color-border)] bg-white/90 px-3 py-1 text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition"
        >
          {backLabel}
        </UiButton>
      </div>
    </div>
  );
}
