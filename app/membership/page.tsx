'use client';

import PaymentDialog from '@/app/components/PaymentDialog';
import { startWeChatCheckout, useWeChatPaymentReturn, type WeChatCheckout } from '@/app/lib/wechat-payment';

import Link from 'next/link';
import { withPackageDisplay } from '@/app/lib/product-display';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Crown,
  PackagePlus,
  RefreshCw,
} from 'lucide-react';
import {
  ProductDetail,
  getMembershipPlans,
  getMyMembership,
  getMyQuotas,
  getOrder,
  getTopupPackages,
  type MembershipMe,
  type MyQuotas,
} from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';

function formatPrice(cents: number) {
  return `¥${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function formatDate(value?: string) {
  if (!value) return '未购买';
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

function productGrantText(product: ProductDetail) {
  const bazi = product.bazi_quota || product.grants.find((g) => g.quota_type === 'chat')?.amount || 0;
  const liuyao = product.liuyao_quota || product.grants.find((g) => g.quota_type === 'liuyao_chat')?.amount || 0;
  return { bazi, liuyao };
}

type PaymentResult = {
  productName: string;
  orderNo: string;
  amountCents: number;
  synced: boolean;
};

export default function MembershipPage() {
  const [membership, setMembership] = useState<MembershipMe | null>(null);
  const [quotas, setQuotas] = useState<MyQuotas | null>(null);
  const [plans, setPlans] = useState<ProductDetail[]>([]);
  const [topups, setTopups] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingCode, setPayingCode] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<WeChatCheckout | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useWeChatPaymentReturn(setCheckout, setError);

  const isAuthed = useMemo(() => typeof window !== 'undefined' && Boolean(getAuthToken()), []);
  const checkoutProduct = useMemo(() => {
    if (!checkout) return null;
    return [...plans, ...topups].find((product) => product.id === checkout.order.product_id) ?? null;
  }, [checkout, plans, topups]);
  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === membership?.membership?.product_id) ?? null,
    [membership, plans],
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [planData, topupData] = await Promise.all([
        getMembershipPlans(),
        getTopupPackages(),
      ]);
      setPlans(planData.map(withPackageDisplay));
      setTopups(topupData);

      if (getAuthToken()) {
        const [membershipData, quotaData] = await Promise.all([
          getMyMembership(),
          getMyQuotas(),
        ]);
        setMembership(membershipData);
        setQuotas(quotaData);
      }
      return true;
    } catch (e) {
      setError((e as Error).message || '加载失败');
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderQr() {
      if (!checkout?.code_url) {
        setQrDataUrl(null);
        return;
      }
      const url = await QRCode.toDataURL(checkout.code_url, {
        margin: 2,
        width: 240,
        color: {
          dark: '#2A2522',
          light: '#FFFFFF',
        },
      });
      if (!cancelled) setQrDataUrl(url);
    }
    void renderQr();
    return () => {
      cancelled = true;
    };
  }, [checkout]);

  useEffect(() => {
    if (!checkout || checkout.order.status === 'PAID') return undefined;

    const timer = window.setInterval(async () => {
      try {
        const order = await getOrder(checkout.order.id);
        if (order.status === 'PAID') {
          window.clearInterval(timer);
          const synced = await refresh();
          setMessage(null);
          setPaymentResult({
            productName: checkoutProduct?.name ?? '已购买权益',
            orderNo: order.out_trade_no,
            amountCents: order.amount_cents,
            synced,
          });
        }
      } catch (e) {
        setError((e as Error).message || '订单状态查询失败');
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [checkout, checkoutProduct]);

  async function buy(productCode: string) {
    if (!getAuthToken()) {
      window.location.href = `/login?redirect=${encodeURIComponent('/membership')}`;
      return;
    }
    setPayingCode(productCode);
    setCheckout(null);
    setQrDataUrl(null);
    setPaymentResult(null);
    setError(null);
    setMessage(null);
    try {
      const result = await startWeChatCheckout(productCode);
      setCheckout(result);
    } catch (e) {
      setError((e as Error).message || '创建支付订单失败');
    } finally {
      setPayingCode(null);
    }
  }



  function closeCheckout() {
    setCheckout(null);
    setQrDataUrl(null);
    setPaymentResult(null);
  }


  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Packages
            </p>
            <h1 className="font-serif text-[1.75rem] font-medium leading-tight text-[var(--color-text-primary)]">
              套餐与额度
            </h1>
            <p className="mt-3 max-w-[62ch] text-[16px] leading-7 text-[var(--color-text-secondary)]">
              新用户注册即享 10 次八字文化 AI 对话和 10 次六爻文化卦象解析；基础套餐各提供 30 次，高级套餐各提供 100 次，额度不足时可购买叠加包。
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
          <p className="mb-5 border border-[rgba(181,68,52,0.24)] bg-[var(--color-bg-card)] px-4 py-3 text-[14px] leading-6 text-[var(--color-primary)]">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-5 border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[14px] leading-6 text-[var(--color-text-primary)]">
            {message}
          </p>
        )}

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <p className="mb-2 text-[13px] text-[var(--color-text-muted)]">套餐状态</p>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">
              {membership?.active ? `已生效${currentPlan ? ` · ${currentPlan.name}` : ''}` : membership?.membership ? '已到期' : '未购买'}
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
              到期：{formatDate(membership?.membership?.current_period_end)}
            </p>
          </div>
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <p className="mb-2 text-[13px] text-[var(--color-text-muted)]">八字额度</p>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">{quotaText(quotas?.chat)}</p>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">用于传统文化 AI 对话（八字文化）</p>
          </div>
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <p className="mb-2 text-[13px] text-[var(--color-text-muted)]">六爻额度</p>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">{quotaText(quotas?.liuyao_chat)}</p>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">用于传统文化卦象解析（六爻文化）</p>
          </div>
        </section>

        {!isAuthed && (
          <div className="mb-8 border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <p className="text-[15px] leading-7 text-[var(--color-text-body)]">
              新用户注册可获得 10 次八字解读和 10 次六爻解卦。登录后可查看额度、购买套餐和叠加包。
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
            <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)]">套餐</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {loading && <div className="h-44 animate-pulse bg-[var(--color-bg-card)]" />}
            {plans.map((plan) => {
              const grant = productGrantText(plan);
              return (
                <article key={plan.code} className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">{plan.name}</h3>
                      <p className="mt-2 text-[14px] leading-6 text-[var(--color-text-secondary)]">{plan.description}</p>
                    </div>
                    <p className="font-serif text-2xl text-[var(--color-text-primary)]">{formatPrice(plan.price_cents)}</p>
                  </div>
                  <ul className="mb-5 space-y-2 text-[14px] text-[var(--color-text-body)]">
                    <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />{grant.bazi} 次传统文化 AI 对话（八字文化）</li>
                    <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />{grant.liuyao} 次传统文化卦象解析（六爻文化）</li>
                    <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />有效期 30 天，续费顺延</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => void buy(plan.code)}
                    disabled={payingCode === plan.code}
                    className="inline-flex min-h-11 w-full items-center justify-center bg-[var(--color-primary)] px-5 text-[14px] font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {payingCode === plan.code
                      ? '创建订单中'
                      : currentPlan?.id === plan.id
                        ? `续费${plan.name}`
                        : membership?.active
                          ? `切换为${plan.name}`
                          : `购买${plan.name}`}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <PackagePlus size={20} className="text-[var(--color-primary)]" />
            <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)]">叠加包</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {topups.map((product) => {
              const grant = productGrantText(product);
              return (
                <article key={product.code} className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">{product.name}</h3>
                      <p className="mt-2 text-[14px] leading-6 text-[var(--color-text-secondary)]">{product.description}</p>
                    </div>
                    <p className="font-serif text-xl text-[var(--color-text-primary)]">{formatPrice(product.price_cents)}</p>
                  </div>
                  <ul className="mb-5 space-y-2 text-[14px] text-[var(--color-text-body)]">
                    <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />八字文化 AI 对话 +{grant.bazi} 次</li>
                    <li className="flex gap-2"><Check size={16} className="mt-0.5 text-[var(--color-primary)]" />六爻文化卦象解析 +{grant.liuyao} 次</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => void buy(product.code)}
                    disabled={payingCode === product.code}
                    className="inline-flex min-h-11 w-full items-center justify-center border border-[var(--color-border-strong)] px-5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] disabled:opacity-50"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {payingCode === product.code ? '创建订单中' : '购买叠加包'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

      </div>

      {checkout && (
        <PaymentDialog checkout={checkout} productName={checkoutProduct?.name ?? '待支付订单'}
          qrDataUrl={qrDataUrl} error={error} onClose={closeCheckout} onComplete={closeCheckout}
          success={paymentResult ? {
            title: paymentResult.synced ? '支付成功，权益已生效' : '支付成功，权益同步中',
            description: paymentResult.synced
              ? `${paymentResult.productName}已到账，当前页面额度已更新。`
              : '微信已确认支付，请稍后刷新查看最新额度。',
            actionLabel: '完成',
          } : undefined} />
      )}
    </main>
  );
}
