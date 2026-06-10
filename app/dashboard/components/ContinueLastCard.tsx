'use client';

import Link from 'next/link';
import { ArrowRight, History, RefreshCw } from 'lucide-react';

import type { ConversationListItem, HistoryType } from '@/app/lib/history/api';
import {
  conversationHref,
  displayTitle,
  formatRelative,
  previewText,
} from './helpers';
import { trackEvent } from '@/app/lib/analytics/track';

type LatestConversation = {
  item: ConversationListItem;
  type: HistoryType;
} | null;

type ContinueLastCardProps = {
  latest: LatestConversation;
  loading: boolean;
};

function LoadingState() {
  return (
    <div className="border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 shadow-[0_2px_12px_rgba(60,40,20,0.08)] sm:p-7">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
        <RefreshCw className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
        正在读取上次的问题
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 bg-[var(--color-bg-hover)]" />
        <div className="h-4 w-full max-w-xl bg-[var(--color-bg-hover)]" />
        <div className="h-4 w-3/4 bg-[var(--color-bg-hover)]" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 shadow-[0_2px_12px_rgba(60,40,20,0.08)] sm:p-7">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
        <History className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <h2 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">还没有解读记录</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
        可以先从八字看长期趋势，或用六爻问一件具体事。记录会在这里形成回访入口。
      </p>
    </div>
  );
}

export function ContinueLastCard({ latest, loading }: ContinueLastCardProps) {
  if (loading) return <LoadingState />;
  if (!latest) return <EmptyState />;

  return (
    <div className="border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 shadow-[0_2px_12px_rgba(60,40,20,0.08)] sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
          <RefreshCw className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
          当前最适合继续
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">{formatRelative(latest.item.updated_at)}</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
            {latest.type === 'bazi' ? '八字解读' : '六爻问事'}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium leading-snug text-[var(--color-text-primary)] sm:text-[1.7rem]">
            {displayTitle(latest.item, latest.type)}
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[var(--color-text-body)]">
            {previewText(latest.item, latest.type === 'bazi' ? '上次的八字解读' : '上次的六爻问事')}
          </p>
          {latest.item.last_assistant_preview && (
            <p className="mt-3 max-w-2xl border-t border-[var(--color-border)] pt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              当前结论：{latest.item.last_assistant_preview}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[180px]">
          <Link
            href={conversationHref(latest.item, latest.type)}
            onClick={() => {
              trackEvent('conversation_continue_click', {
                payload: {
                  type: latest.type,
                  conversation_id: latest.item.id,
                  source: 'dashboard_continue_card',
                },
              });
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[3px] bg-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
          >
            继续分析
            <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
          </Link>
          <Link
            href="/history"
            onClick={() => {
              trackEvent('history_view', {
                payload: {
                  source: 'dashboard_continue_card',
                },
              });
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
          >
            查看上次结论
          </Link>
        </div>
      </div>
    </div>
  );
}
