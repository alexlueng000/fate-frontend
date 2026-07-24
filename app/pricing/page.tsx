'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Check, CheckCircle2, Copy, QrCode, X } from 'lucide-react';
import Footer from '@/app/components/Footer';
import {
  createWeChatNativeCheckout,
  getMembershipPlans,
  getOrder,
  type ProductDetail,
  type WeChatNativeCheckoutResult,
} from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';

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
  const [checkout, setCheckout] = useState<WeChatNativeCheckoutResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [mobilePayment, setMobilePayment] = useState(false);
  const [wechatBrowser, setWechatBrowser] = useState(false);

  const checkoutProduct = useMemo(
    () => products.find((product) => product.id === checkout?.order.product_id) ?? null,
    [checkout, products],
  );

  useEffect(() => {
    let cancelled = false;
    getMembershipPlans()
      .then((data) => {
        if (!cancelled) setProducts(data.slice(0, 2));
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
    setMobilePayment(window.matchMedia('(max-width: 639px)').matches);
    setWechatBrowser(/MicroMessenger/i.test(window.navigator.userAgent));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderQr() {
      if (!checkout?.code_url) {
        setQrDataUrl(null);
        return;
      }
      const dataUrl = await QRCode.toDataURL(checkout.code_url, {
        margin: 1,
        width: 240,
        color: { dark: '#2A2522', light: '#FBF8F4' },
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
          name: index === 0 ? '基础套餐' : '高级套餐',
          description:
            product.description ||
            (index === 0 ? '适合初次体验完整功能' : '适合持续探索与深度使用'),
          popular: index === 1,
          features: [
            `${bazi} 次八字 AI 对话`,
            `${liuyao} 次六爻 AI 解读`,
            '会员有效期 30 天，续费顺延',
            '会员视频观看权限',
            'AI 智能分析与专业命理知识库',
          ],
        };
      }),
    [products],
  );

  async function buy(product: ProductDetail) {
    if (!getAuthToken()) {
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }
    setPayingCode(product.code);
    setError(null);
    setPaymentComplete(false);
    try {
      const result = await createWeChatNativeCheckout(product.code);
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

  async function copyPaymentLink() {
    if (!checkout?.code_url) return;
    await navigator.clipboard.writeText(checkout.code_url);
  }

  function openWeChatPayment() {
    if (!checkout?.code_url) return;
    window.location.href = checkout.code_url;
  }

  async function copyCurrentPageLink() {
    await navigator.clipboard.writeText(window.location.href);
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
            八字看长期趋势，六爻看具体事项；会员额度与会员中心实时保持一致。
          </p>
          <div className="mt-10 inline-flex items-center gap-8 text-sm text-[var(--color-text-secondary)]">
            <span className="font-serif">八字</span>
            <span className="h-4 w-px bg-[var(--color-border)]" aria-hidden />
            <span className="font-serif">六爻</span>
            <span className="h-4 w-px bg-[var(--color-border)]" aria-hidden />
            <span className="font-serif">课程</span>
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
                套餐数据从哪里来？
              </dt>
              <dd className="font-serif text-[15px] leading-[1.75] text-[var(--color-text-body)]">
                价格、额度和商品说明直接读取会员中心同一套商品配置，两处不会再出现不同步。
              </dd>
            </div>
            <div>
              <dt className="mb-3 font-serif text-[17px] font-medium text-[var(--color-text-primary)]">
                会员额度会过期吗？
              </dt>
              <dd className="font-serif text-[15px] leading-[1.75] text-[var(--color-text-body)]">
                月付会员权益有效期为 30 天；续费后会员期限顺延，具体权益以会员中心展示为准。
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {checkout && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(42,37,34,0.48)]"
            aria-label="关闭支付弹窗"
            onClick={closeCheckout}
          />
          <section
            className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-lg)] sm:max-w-xl sm:p-8"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <button
              type="button"
              onClick={closeCheckout}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label="关闭"
            >
              <X size={20} />
            </button>

            {paymentComplete ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-5 text-[var(--color-primary)]" size={42} strokeWidth={1.5} />
                <h2 id="checkout-title" className="font-serif text-2xl text-[var(--color-text-primary)]">
                  支付成功，权益已开通
                </h2>
                <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
                  {checkoutProduct?.name ?? '会员套餐'}已生效，可直接开始使用。
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="mt-7 bg-[var(--color-primary)] px-8 py-3 text-[15px] font-medium text-[var(--color-text-inverse)]"
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  返回命理首页
                </button>
              </div>
            ) : (
              <>
                <div className="pr-12">
                  <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[var(--color-primary)]">
                    <QrCode size={16} />
                    微信扫码支付
                  </p>
                  <h2 id="checkout-title" className="font-serif text-xl text-[var(--color-text-primary)] sm:text-2xl">
                    {checkoutProduct?.name ?? '会员套餐'}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    支付金额 {formatPrice(checkout.order.amount_cents)}
                  </p>
                </div>

                {mobilePayment && (
                  <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-bg-alt)] p-3 text-center sm:mt-6 sm:p-4">
                    <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                      {wechatBrowser ? '在微信中完成支付' : '当前浏览器不能直接调起微信支付'}
                    </p>
                    {wechatBrowser ? (
                      <button
                        type="button"
                        onClick={openWeChatPayment}
                        className="mt-3 min-h-11 w-full bg-[var(--color-primary)] px-5 text-[15px] font-medium text-[var(--color-text-inverse)]"
                        style={{ borderRadius: 'var(--radius-md)' }}
                      >
                        打开微信支付
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void copyCurrentPageLink()}
                        className="mt-3 min-h-11 w-full border border-[var(--color-border-strong)] px-5 text-[14px] font-medium text-[var(--color-text-primary)]"
                        style={{ borderRadius: 'var(--radius-md)' }}
                      >
                        复制页面链接，去微信打开
                      </button>
                    )}
                    <p className="mt-3 text-[13px] leading-6 text-[var(--color-text-secondary)]">
                      {wechatBrowser
                        ? '如果没有自动打开，请长按下方二维码，选择“识别图中二维码”。'
                        : '也可以使用另一台设备的微信扫描下方二维码。'}
                    </p>
                  </div>
                )}

                <div className={`mt-4 grid gap-4 sm:mt-6 sm:gap-6 ${mobilePayment ? '' : 'sm:grid-cols-[240px_1fr] sm:items-center'}`}>
                  <div className={`mx-auto flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 ${
                    mobilePayment ? 'h-40 w-40' : 'h-60 w-60'
                  }`}>
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="微信支付二维码" className="h-full w-full" />
                    ) : (
                      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                    )}
                  </div>
                  <div className={mobilePayment ? 'text-center' : ''}>
                    <p className={`${mobilePayment ? 'text-[12px] leading-5' : 'text-[15px] leading-7'} text-[var(--color-text-body)]`}>
                      请使用微信扫描二维码完成支付。页面会自动确认订单并发放会员权益，请勿重复下单。
                    </p>
                    {!mobilePayment && (
                      <button
                        type="button"
                        onClick={() => void copyPaymentLink()}
                        className="mt-5 inline-flex min-h-11 items-center gap-2 border border-[var(--color-border-strong)] px-4 text-sm text-[var(--color-text-primary)]"
                        style={{ borderRadius: 'var(--radius-md)' }}
                      >
                        <Copy size={16} />
                        复制支付链接
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      <Footer />
    </div>
  );
}
