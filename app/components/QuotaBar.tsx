'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getMyQuotas, type MyQuotas } from '@/app/lib/api';

type QuotaType = 'chat' | 'liuyao_chat';

const META: Record<QuotaType, { label: string; symbol: string }> = {
  chat: { label: '八字解读', symbol: '☰' },
  liuyao_chat: { label: '六爻问卦', symbol: '⚊' },
};

type State = 'unlimited' | 'normal' | 'low' | 'empty';

const TONE: Record<State, {
  // background tint of the entire row
  rowBg: string;
  // icon badge
  iconBg: string;
  iconText: string;
  // count text emphasis color
  countText: string;
  // progress fill
  fill: string;
  // CTA color
  cta: string;
}> = {
  unlimited: {
    rowBg: 'bg-gradient-to-r from-[var(--color-gold)]/10 via-white to-white hover:from-[var(--color-gold)]/15',
    iconBg: 'bg-[var(--color-gold)]/15',
    iconText: 'text-[var(--color-gold-dark)]',
    countText: 'text-[var(--color-text-secondary)]',
    fill: 'bg-[var(--color-gold)]',
    cta: 'text-[var(--color-gold-dark)]',
  },
  normal: {
    rowBg: 'bg-gradient-to-r from-[var(--color-primary)]/[0.04] via-white to-white hover:from-[var(--color-primary)]/[0.08]',
    iconBg: 'bg-[var(--color-primary)]/10',
    iconText: 'text-[var(--color-primary)]',
    countText: 'text-[var(--color-text-primary)]',
    fill: 'bg-[var(--color-primary)]',
    cta: 'text-[var(--color-primary)]',
  },
  low: {
    rowBg: 'bg-gradient-to-r from-amber-50 via-white to-white hover:from-amber-100',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    countText: 'text-amber-800',
    fill: 'bg-amber-500',
    cta: 'text-amber-700',
  },
  empty: {
    rowBg: 'bg-gradient-to-r from-red-50 via-white to-white hover:from-red-100',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    countText: 'text-red-700',
    fill: 'bg-red-500',
    cta: 'text-red-700',
  },
};

interface QuotaBarProps {
  type: QuotaType;
  /** 父组件递增此值触发重新拉取（每次发送/购买后 +1）。 */
  refreshKey?: number;
  className?: string;
}

/**
 * 一行式剩余次数 strip。
 * 适合放在头部信息栏下方作为独立一行（panel 页用）。
 * 比 QuotaChip 信息密度更高：标签 + 当前/总数 + 进度条 + CTA。
 */
export function QuotaBar({ type, refreshKey = 0, className = '' }: QuotaBarProps) {
  const [data, setData] = useState<MyQuotas | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('auth_token')) return;
    let alive = true;
    getMyQuotas()
      .then((d) => { if (alive) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [refreshKey]);

  // skeleton 一行，避免布局跳动
  if (!data) {
    return (
      <div className={`px-4 py-2 border-b border-[var(--color-border)] bg-white/40 ${className}`}>
        <div className="h-3.5 w-48 rounded bg-[var(--color-bg-hover)] animate-pulse" />
      </div>
    );
  }

  const q = data[type];
  const { label, symbol } = META[type];
  const unlimited = q.is_unlimited || q.total === -1;
  const empty = !unlimited && q.remaining <= 0;
  const low = !unlimited && !empty && q.remaining <= 3;
  const state: State = unlimited ? 'unlimited' : empty ? 'empty' : low ? 'low' : 'normal';
  const t = TONE[state];

  const pct = unlimited
    ? 100
    : Math.max(0, Math.min(100, (q.remaining / Math.max(1, q.total)) * 100));

  const ctaText = empty ? '立即充值' : '查看套餐';

  return (
    <Link
      href="/pricing"
      className={`group block border-b border-[var(--color-border)] transition-colors ${t.rowBg} ${className}`}
      aria-label={`${label} ${unlimited ? '内测期不限次数' : empty ? '次数已用完' : `剩余 ${q.remaining} 次`}，点击查看套餐`}
    >
      <div className="px-4 py-2 flex items-center gap-3 min-w-0">
        {/* Icon + label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-[15px] font-semibold ${t.iconBg} ${t.iconText} transition-transform group-hover:scale-105`}
            aria-hidden
          >
            {symbol}
          </span>
          <span className="text-[12px] sm:text-sm font-medium text-[var(--color-text-primary)] tracking-tight">
            {label}
          </span>
        </div>

        {/* Count + progress (progress bar hidden < sm) */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="text-[12px] sm:text-sm tabular-nums whitespace-nowrap">
            {unlimited ? (
              <span className={t.countText}>内测期 · 不限次数</span>
            ) : empty ? (
              <span className={`${t.countText} font-semibold`}>次数已用完</span>
            ) : (
              <>
                <span className={`font-bold text-[15px] sm:text-base ${t.countText}`}>{q.remaining}</span>
                <span className="text-[var(--color-text-muted)]"> / {q.total} 次</span>
              </>
            )}
          </div>

          {!unlimited && !empty && (
            <div className="hidden sm:block flex-1 max-w-[220px] h-1.5 rounded-full bg-[var(--color-bg-hover)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${t.fill}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        {/* CTA */}
        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[12px] sm:text-sm font-semibold ${t.cta} group-hover:gap-1.5 transition-all`}>
          {ctaText}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
