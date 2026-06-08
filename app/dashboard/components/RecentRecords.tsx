'use client';

import Link from 'next/link';
import { ArrowRight, Compass, FileText } from 'lucide-react';

import type { ConversationListItem, HistoryType } from '@/app/lib/history/api';
import {
  conversationHref,
  displayTitle,
  formatRelative,
  previewText,
} from './helpers';

type RecentRecord = {
  item: ConversationListItem;
  type: HistoryType;
};

type RecentRecordsProps = {
  items: RecentRecord[];
  loading: boolean;
};

export function RecentRecords({ items, loading }: RecentRecordsProps) {
  return (
    <section className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">最近解读记录</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">回看过往判断，也可以从记录里继续追问。</p>
        </div>
        <Link
          href="/history"
          className="inline-flex min-h-11 items-center gap-2 rounded-[3px] px-3 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
        >
          全部记录
          <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
        </Link>
      </div>

      {loading ? (
        <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-sm leading-6 text-[var(--color-text-secondary)]">
          正在读取最近记录
        </div>
      ) : items.length ? (
        <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {items.map(({ item, type }) => {
            const Icon = type === 'bazi' ? FileText : Compass;
            return (
              <Link
                key={`${type}-${item.id}`}
                href={conversationHref(item, type)}
                className="grid min-h-[76px] gap-2 py-3 transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[rgba(181,68,52,0.12)] sm:grid-cols-[1fr_auto] sm:items-center sm:px-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.6} />
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {displayTitle(item, type)}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--color-text-secondary)]">
                    {previewText(item, type === 'bazi' ? '八字解读记录' : item.hexagram?.question || '六爻问事记录')}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">{formatRelative(item.updated_at)}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-sm leading-6 text-[var(--color-text-secondary)]">
          还没有记录。你可以先从上面的八字或六爻入口开始。
        </div>
      )}
    </section>
  );
}
