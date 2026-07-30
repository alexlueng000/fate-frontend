'use client';

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
      <h1 className="text-xl font-semibold text-red-900 shrink-0">对话解读</h1>
      <div className="flex items-center gap-2 text-xs text-neutral-700 min-w-0 flex-wrap justify-end">
        {rightExtra}
        {conversationId ? (
          <span className="hidden sm:inline px-2 py-1 rounded bg-white/70 border border-red-200 truncate max-w-[160px]">
            {conversationId}
          </span>
        ) : (
          <span className="hidden sm:inline text-neutral-500">正在建立会话…</span>
        )}
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-full border border-red-200 bg-white/90 px-3 py-1 text-red-800 hover:bg-red-50 transition"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}
