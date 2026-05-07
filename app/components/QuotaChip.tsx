'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getMyQuotas, type MyQuotas } from '@/app/lib/api';

type QuotaType = 'chat' | 'liuyao_chat';

const LABELS: Record<QuotaType, string> = {
  chat: '八字',
  liuyao_chat: '六爻',
};

interface QuotaChipProps {
  type: QuotaType;
  /** 父组件可以通过递增此值触发刷新（每次发送/购买后 +1）。 */
  refreshKey?: number;
  /** 自定义额外类名。 */
  className?: string;
}

/**
 * 显眼的剩余次数 chip。
 * - 默认底色白；剩余 ≤3 转琥珀；剩余=0 转红色。
 * - 点击跳转 /pricing。
 * - 移动端友好：固定 padding，缩进自动换行。
 */
export function QuotaChip({ type, refreshKey = 0, className = '' }: QuotaChipProps) {
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

  if (!data) return null;
  const q = data[type];
  const label = LABELS[type];
  const unlimited = q.is_unlimited || q.total === -1;
  const empty = !unlimited && q.remaining <= 0;
  const low = !unlimited && !empty && q.remaining <= 3;

  const tone = empty
    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 ring-1 ring-red-300/40'
    : low
      ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50';

  const text = unlimited
    ? `${label} · 内测免费`
    : empty
      ? `${label}次数已用完 · 立即充值`
      : `${label}剩余 ${q.remaining} 次`;

  return (
    <Link
      href="/pricing"
      title={empty ? '点击前往充值' : '查看套餐'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm transition-all ${tone} ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 shrink-0" />
      <span className="whitespace-nowrap">{text}</span>
    </Link>
  );
}
