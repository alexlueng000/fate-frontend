'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import Footer from '@/app/components/Footer';
import { getMembershipPlans, type ProductDetail } from '@/app/lib/api';
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

  function goToMembership() {
    if (!getAuthToken()) {
      router.push(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }
    router.push('/membership');
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
                onClick={goToMembership}
                className={`mb-8 w-full px-6 py-[14px] font-sans text-[15px] font-medium transition-colors duration-200 ${
                  popular
                    ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)]'
                    : 'border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                立即购买
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
      <Footer />
    </div>
  );
}
