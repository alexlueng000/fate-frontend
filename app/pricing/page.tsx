'use client';

import PaymentDialog from '@/app/components/PaymentDialog';
import { startWeChatCheckout, useWeChatPaymentReturn, type WeChatCheckout } from '@/app/lib/wechat-payment';

import { withPackageDisplay } from '@/app/lib/product-display';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Check } from 'lucide-react';
import Footer from '@/app/components/Footer';
import {
  getMembershipPlans,
  getOrder,
  type ProductDetail,
} from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { trackEvent } from '@/app/lib/analytics/track';

function formatPrice(cents: number) {
  return `¥${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function productGrant(product: ProductDetail, quotaType: 'chat' | 'liuyao_chat') {
  if (quotaType === 'chat' && product.bazi_quota) return product.bazi_quota;
  if (quotaType === 'liuyao_chat' && product.liuyao_quota) return product.liuyao_quota;
  return product.grants.find((grant) => grant.quota_type === quotaType)?.amount ?? 0;
}

export default function PricingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingCode, setPayingCode] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<WeChatCheckout | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  useWeChatPaymentReturn(setCheckout, setError);

  const checkoutProduct = useMemo(
    () => products.find((product) => product.id === checkout?.order.product_id) ?? null,
    [checkout, products],
  );

  useEffect(() => {
    trackEvent('pricing_view', {
      payload: { entry: 'pricing' },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMembershipPlans()
      .then((data) => {
        if (!cancelled) setProducts(data.slice(0, 2).map(withPackageDisplay));
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError((reason as Error).message || '套餐加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderQr() {
      if (!checkout?.code_url) {
        setQrDataUrl(null);
        return;
      }
      const dataUrl = await QRCode.toDataURL(checkout.code_url, {
        margin: 2,
        width: 240,
        color: { dark: '#2A2522', light: '#FFFFFF' },
      });
      if (!cancelled) setQrDataUrl(dataUrl);
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
          setPaymentComplete(true);
          trackEvent('payment_success', {
            payload: { order_id: order.id, product_id: order.product_id, amount_cents: order.amount_cents },
          });
        }
      } catch (reason: unknown) {
        setError((reason as Error).message || '订单状态查询失败');
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [checkout]);

  const plans = useMemo(
    () =>
      products.map((product, index) => {
        const bazi = productGrant(product, 'chat');
        const liuyao = productGrant(product, 'liuyao_chat');
        return {
          product,
          name: product.name,
          description:
            product.description ||
            (index === 0 ? '适合初次体验完整功能' : '适合持续探索与深度使用'),
          popular: index === 1,
          features: [
            `${bazi} 次传统文化 AI 对话（八字文化）`,
            `${liuyao} 次传统文化卦象解析（六爻文化）`,
            '套餐有效期 30 天，续费顺延',
            'AI 智能分析与传统文化知识库',
          ],
        };
      }),
    [products],
  );

  async function buy(product: ProductDetail) {
    trackEvent('order_create_click', {
      payload: { product_id: product.id, product_code: product.code, amount_cents: product.price_cents },
    });
    if (!getAuthToken()) {
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }
    setPayingCode(product.code);
    setError(null);
    setPaymentComplete(false);
    try {
      const result = await startWeChatCheckout(product.code);
      setCheckout(result);
    } catch (reason: unknown) {
      setError((reason as Error).message || '创建支付订单失败');
    } finally {
      setPayingCode(null);
    }
  }

  function closeCheckout() {
    setCheckout(null);
    setQrDataUrl(null);
    setPaymentComplete(false);
  }




  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-24 sm:px-8 lg:px-10">
        <header className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          <p className="mb-5 font-sans text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
            Pricing · 定价方案
          </p>
          <h1 className="mb-5 font-serif text-[2rem] font-medium leading-[1.2] text-[var(--color-text-primary)] md:text-[2.75rem] md:leading-[1.15]">
            选择一种与自己相处的方式
          </h1>
          <p className="font-serif text-[1.0625rem] leading-[1.7] text-[var(--color-text-body)]">
            八字看长期趋势，六爻看具体事项；按需选择套餐，额度不足时可购买叠加包。
          </p>
          <div className="mt-10 inline-flex items-center gap-8 text-sm text-[var(--color-text-secondary)]">
            <span className="font-serif">八字</span>
            <span className="h-4 w-px bg-[var(--color-border)]" aria-hidden />
            <span className="font-serif">六爻</span>
          </div>
        </header>

        {error && (
          <p className="mx-auto mb-6 max-w-5xl border border-[rgba(181,68,52,0.24)] bg-[var(--color-bg-card)] px-4 py-3 text-center text-sm text-[var(--color-primary)]">
            {error}
          </p>
        )}

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
          {loading &&
            [0, 1].map((item) => (
              <div
                key={item}
                className="h-[460px] animate-pulse border border-[var(--color-border)] bg-[var(--color-bg-card)]"
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
            ))}

          {plans.map(({ product, name, description, popular, features }) => (
            <article
              key={product.code}
              className={`relative bg-[var(--color-bg-card)] p-8 transition-shadow duration-200 hover:shadow-[var(--shadow-md)] md:p-10 ${
                popular
                  ? 'border border-[var(--color-primary)]/40 shadow-[var(--shadow-sm)]'
                  : 'border border-[var(--color-border)]'
              }`}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              {popular && (
                <div className="absolute -top-3 left-8">
                  <span
                    className="inline-flex bg-[var(--color-primary)] px-3 py-1 font-sans text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-inverse)]"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                    最受欢迎
                  </span>
                </div>
              )}

              <header className="mb-8 border-b border-[var(--color-border)] pb-6">
                <h2 className="mb-2 font-serif text-2xl font-medium text-[var(--color-text-primary)]">
                  {name}
                </h2>
                <p className="font-serif text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">
                  {description}
                </p>
              </header>

              <div className="mb-8">
                <div className="font-serif text-[2rem] font-medium leading-none text-[var(--color-text-primary)]">
                  {formatPrice(product.price_cents)}
                  <span className="ml-2 font-sans text-sm font-normal text-[var(--color-text-muted)]">/ 30 天</span>
                </div>
                <p className="mt-3 font-sans text-[13px] text-[var(--color-text-muted)]">
                  商品：{product.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void buy(product)}
                disabled={payingCode === product.code}
                className={`mb-8 w-full px-6 py-[14px] font-sans text-[15px] font-medium transition-colors duration-200 ${
                  popular
                    ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]'
                    : 'border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                } disabled:cursor-wait disabled:opacity-60`}
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                {payingCode === product.code ? '创建订单中…' : '立即购买'}
              </button>

              <ul className="space-y-3">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start font-serif text-[15px] leading-[1.6] text-[var(--color-text-body)]"
                  >
                    <Check
                      className="mr-3 mt-[5px] h-4 w-4 flex-shrink-0 text-[var(--color-primary)]"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mx-auto mt-24 max-w-4xl border-t border-[var(--color-border)] pt-16 md:mt-28 md:pt-20">
          <h2 className="mb-12 text-center font-serif text-[1.625rem] font-medium text-[var(--color-text-primary)] md:text-[1.875rem]">
            常见问题
          </h2>
          <dl className="grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
            <div>
              <dt className="mb-3 font-serif text-[17px] font-medium text-[var(--color-text-primary)]">
                购买后在哪里查看额度？
              </dt>
              <dd className="font-serif text-[15px] leading-[1.75] text-[var(--color-text-body)]">
                登录后进入“套餐与额度”，即可查看当前套餐、剩余额度和套餐到期时间。
              </dd>
            </div>
            <div>
              <dt className="mb-3 font-serif text-[17px] font-medium text-[var(--color-text-primary)]">
                套餐额度会过期吗？
              </dt>
              <dd className="font-serif text-[15px] leading-[1.75] text-[var(--color-text-body)]">
                套餐权益有效期为 30 天；续费后套餐期限顺延，具体权益以“套餐与额度”页面展示为准。
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {checkout && (
        <PaymentDialog checkout={checkout} productName={checkoutProduct?.name ?? '套餐'}
          qrDataUrl={qrDataUrl} error={error} onClose={closeCheckout}
          onComplete={() => router.push('/dashboard')}
          success={paymentComplete ? {
            title: '支付成功，权益已开通',
            description: `${checkoutProduct?.name ?? '套餐'}已生效，可以开始使用了。`,
            actionLabel: '开始使用',
          } : undefined} />
      )}
      <Footer />
    </div>
  );
}
