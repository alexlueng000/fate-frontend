'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Crown, PackagePlus, RefreshCw } from 'lucide-react';
import {
  ProductDetail,
  getMembershipPlans,
  getMyMembership,
  getMyQuotas,
  getTopupPackages,
  simulatePayment,
  type MembershipMe,
  type MyQuotas,
} from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';

function formatPrice(cents: number) {
  return `¥${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function formatDate(value?: string) {
  if (!value) return '未开通';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function quotaText(quota?: { remaining: number; total: number; is_unlimited: boolean }) {
  if (!quota) return '未获取';
  if (quota.is_unlimited || quota.total === -1) return '无限';
  return `${quota.remaining} / ${quota.total}`;
}

export default function MembershipPage() {
  const [membership, setMembership] = useState<MembershipMe | null>(null);
  const [quotas, setQuotas] = useState<MyQuotas | null>(null);
  const [plans, setPlans] = useState<ProductDetail[]>([]);
  const [topups, setTopups] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingCode, setPayingCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAuthed = useMemo(() => typeof window !== 'undefined' && Boolean(getAuthToken()), []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [planData, topupData] = await Promise.all([
        getMembershipPlans(),
        getTopupPackages(),
      ]);
      setPlans(planData);
      setTopups(topupData);

      if (getAuthToken()) {
        const [membershipData, quotaData] = await Promise.all([
          getMyMembership(),
          getMyQuotas(),
        ]);
        setMembership(membershipData);
        setQuotas(quotaData);
      }
    } catch (e) {
      setError((e as Error).message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function buy(productCode: string) {
    if (!getAuthToken()) {
      window.location.href = `/login?redirect=${encodeURIComponent('/membership')}`;
      return;
    }
    setPayingCode(productCode);
    setError(null);
    setMessage(null);
    try {
      await simulatePayment(productCode);
      setMessage('权益已发放，可以继续使用。');
      await refresh();
    } catch (e) {
      setError((e as Error).message || '购买失败');
    } finally {
      setPayingCode(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[13px] font-medium tracking-[0.16em] text-[var(--color-text-muted)]">
              MEMBERSHIP
            </p>
            <h1 className="font-serif text-[1.75rem] font-medium leading-tight text-[var(--color-text-primary)]">
              会员与额度
            </h1>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-7 text-[var(--color-text-secondary)]">
              会员月卡包含八字、六爻额度和视频学习权限；额度不足时，可按需要购买叠加包。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--color-border-strong)] px-4 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)]"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </header>

        {error && (
          <p className="mb-5 border border-[rgba(181,68,52,0.24)] bg-[var(--color-bg-card)] px-4 py-3 text-[14px] text-[var(--color-primary)]">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-5 border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[14px] text-[var(--color-text-primary)]">
            {message}
          </p>
        )}

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <p className="mb-2 text-[13px] text-[var(--color-text-muted)]">会员状态</p>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">
              {membership?.active ? '已开通' : '未开通'}
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
              到期：{formatDate(membership?.membership?.current_period_end)}
            </p>
          </div>
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <p className="mb-2 text-[13px] text-[var(--color-text-muted)]">八字额度</p>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">{quotaText(quotas?.chat)}</p>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">用于八字 AI 解读</p>
          </div>
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <p className="mb-2 text-[13px] text-[var(--color-text-muted)]">六爻额度</p>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">{quotaText(quotas?.liuyao_chat)}</p>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">用于六爻问卦解读</p>
          </div>
        </section>

        {!isAuthed && (
          <div className="mb-8 border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <p className="text-[15px] leading-7 text-[var(--color-text-body)]">
              登录后可以查看会员状态、购买月卡和叠加包。
            </p>
            <Link
              href="/login?redirect=/membership"
              className="mt-4 inline-flex min-h-11 items-center bg-[var(--color-primary)] px-5 text-[14px] font-medium text-[var(--color-text-inverse)]"
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              登录
            </Link>
          </div>
        )}

        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Crown size={20} className="text-[var(--color-primary)]" />
            <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)]">会员月卡</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {loading && <div className="h-44 animate-pulse bg-[var(--color-bg-card)]" />}
            {plans.map((plan) => (
              <article key={plan.code} className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">{plan.name}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-[var(--color-text-secondary)]">{plan.description}</p>
                  </div>
                  <p className="font-serif text-2xl text-[var(--color-text-primary)]">{formatPrice(plan.price_cents)}</p>
                </div>
                <ul className="mb-5 space-y-2 text-[14px] text-[var(--color-text-body)]">
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />100 次八字解读</li>
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />100 次六爻问卦</li>
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />会员视频学习权限</li>
                </ul>
                <button
                  type="button"
                  onClick={() => void buy(plan.code)}
                  disabled={payingCode === plan.code}
                  className="inline-flex min-h-11 w-full items-center justify-center bg-[var(--color-primary)] px-5 text-[14px] font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  {payingCode === plan.code ? '处理中' : membership?.active ? '续费会员' : '开通会员'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <PackagePlus size={20} className="text-[var(--color-primary)]" />
            <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)]">叠加包</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {topups.map((product) => (
              <article key={product.code} className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">{product.name}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-[var(--color-text-secondary)]">{product.description}</p>
                  </div>
                  <p className="font-serif text-xl text-[var(--color-text-primary)]">{formatPrice(product.price_cents)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void buy(product.code)}
                  disabled={payingCode === product.code}
                  className="inline-flex min-h-11 w-full items-center justify-center border border-[var(--color-border-strong)] px-5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-50"
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  {payingCode === product.code ? '处理中' : '购买叠加包'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <Link href="/videos" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[var(--color-primary)]">
            <BookOpen size={17} />
            去看视频课程
          </Link>
        </div>
      </div>
    </main>
  );
}
