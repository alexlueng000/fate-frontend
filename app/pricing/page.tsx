"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { simulatePayment, SimulatePaymentResult } from "@/app/lib/api";
import { getAuthToken } from "@/app/lib/auth";
import Footer from "@/app/components/Footer";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonStyle: "outline" | "primary";
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "basic_combo",
    name: "基础套餐",
    description: "适合新用户体验完整功能",
    features: [
      "10 次八字 AI 解读（含开场与追问）",
      "30 天心镜灯情绪追踪",
      "3 次六爻 AI 解读（含起卦与追问）",
      "AI 智能分析",
      "专业命理知识库",
      "次数永久有效",
    ],
    buttonText: "立即购买",
    buttonStyle: "outline",
  },
  {
    id: "premium_combo",
    name: "高级套餐",
    badge: "最受欢迎",
    description: "适合深度用户，全面探索命理",
    features: [
      "50 次八字 AI 解读（含开场与追问）",
      "180 天心镜灯情绪追踪",
      "15 次六爻 AI 解读（含起卦与追问）",
      "AI 智能分析",
      "专业命理知识库",
      "次数永久有效",
      "赠送专属客服",
    ],
    buttonText: "立即购买",
    buttonStyle: "primary",
    popular: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [modalPlan, setModalPlan] = useState<PricingPlan | null>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<SimulatePaymentResult | null>(null);

  function openModal(plan: PricingPlan) {
    const token = getAuthToken();
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }
    setModalPlan(plan);
    setError(null);
    setSuccess(null);
  }

  function closeModal() {
    setModalPlan(null);
    setError(null);
    setPaying(false);
    setSuccess(null);
  }

  async function handlePay() {
    if (!modalPlan) return;
    setPaying(true);
    setError(null);
    try {
      const result = await simulatePayment(modalPlan.id);
      setSuccess(result);
    } catch (e: unknown) {
      setError((e as Error).message || "购买失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <div className="flex-1 max-w-6xl mx-auto w-full px-5 sm:px-8 lg:px-10 pt-24 pb-20">
        <header className="max-w-3xl mx-auto text-center mb-14 md:mb-20">
          <p className="font-sans text-xs tracking-[0.24em] uppercase text-[var(--color-text-muted)] mb-5">
            Pricing · 定价方案
          </p>
          <h1 className="font-serif text-[2rem] leading-[1.2] md:text-[2.75rem] md:leading-[1.15] font-medium text-[var(--color-text-primary)] mb-5">
            选择一种与自己相处的方式
          </h1>
          <p className="font-serif text-[1.0625rem] leading-[1.7] text-[var(--color-text-body)]">
            三个入口——八字、心镜灯、六爻——从认识自己，到看见情绪，再到回应下一步。
          </p>

          <div className="mt-10 inline-flex items-center gap-8 text-sm text-[var(--color-text-secondary)]">
            <span className="font-serif">八字</span>
            <span className="w-px h-4 bg-[var(--color-border)]" aria-hidden />
            <span className="font-serif">心镜灯</span>
            <span className="w-px h-4 bg-[var(--color-border)]" aria-hidden />
            <span className="font-serif">六爻</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            return (
              <article
                key={plan.id}
                className={`relative bg-[var(--color-bg-card)] p-8 md:p-10 transition-shadow duration-200 hover:shadow-[var(--shadow-md)] ${
                  isPopular
                    ? "border border-[var(--color-primary)]/40 shadow-[var(--shadow-sm)]"
                    : "border border-[var(--color-border)]"
                }`}
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-8">
                    <span
                      className="inline-flex items-center font-sans text-[11px] tracking-[0.16em] uppercase px-3 py-1 bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
                      style={{ borderRadius: "var(--radius-sm)" }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <header className="mb-8 pb-6 border-b border-[var(--color-border)]">
                  <h2 className="font-serif text-2xl font-medium text-[var(--color-text-primary)] mb-2">
                    {plan.name}
                  </h2>
                  <p className="font-serif text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">
                    {plan.description}
                  </p>
                </header>

                <div className="mb-8">
                  <div className="font-serif text-[2rem] font-medium text-[var(--color-text-primary)] leading-none">
                    未定价
                  </div>
                  <p className="mt-3 font-sans text-[13px] text-[var(--color-text-muted)]">
                    内测阶段，定价方案制定中
                  </p>
                </div>

                <button
                  onClick={() => openModal(plan)}
                  className={`w-full px-6 py-[14px] font-sans text-[15px] font-medium transition-colors duration-200 mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-card)] ${
                    plan.buttonStyle === "primary"
                      ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]"
                      : "border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  {plan.buttonText}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start font-serif text-[15px] leading-[1.6] text-[var(--color-text-body)]"
                    >
                      <Check
                        className="h-4 w-4 flex-shrink-0 text-[var(--color-primary)] mr-3 mt-[5px]"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <section className="mt-24 md:mt-28 border-t border-[var(--color-border)] pt-16 md:pt-20 max-w-4xl mx-auto">
          <h2 className="font-serif text-[1.625rem] md:text-[1.875rem] font-medium text-[var(--color-text-primary)] text-center mb-12">
            常见问题
          </h2>
          <dl className="grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
            <div>
              <dt className="font-serif text-[17px] font-medium text-[var(--color-text-primary)] mb-3">
                &ldquo;1 次解读&rdquo; 怎么算？
              </dt>
              <dd className="font-serif text-[15px] leading-[1.75] text-[var(--color-text-body)]">
                每次让 AI 生成一段解读都算 1 次：首次开场、点击快捷分析、输入框追问都是。重新生成上一段回复
                <span className="font-medium text-[var(--color-text-primary)]"> 不 </span>
                额外计费。
              </dd>
            </div>
            <div>
              <dt className="font-serif text-[17px] font-medium text-[var(--color-text-primary)] mb-3">
                次数会过期吗？
              </dt>
              <dd className="font-serif text-[15px] leading-[1.75] text-[var(--color-text-body)]">
                不会。购买的八字 / 六爻次数永久有效，随时使用。心镜灯的天数从首次启用当日开始计算。
              </dd>
            </div>
            <div>
              <dt className="font-serif text-[17px] font-medium text-[var(--color-text-primary)] mb-3">
                可以退款吗？
              </dt>
              <dd className="font-serif text-[15px] leading-[1.75] text-[var(--color-text-body)]">
                未使用的次数支持 7 天内无理由退款；已使用的次数不支持退款。
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {modalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-modal-title"
        >
          <div
            className="absolute inset-0 bg-[rgba(60,40,20,0.45)]"
            onClick={closeModal}
            aria-hidden
          />
          <div
            className="relative z-10 bg-[var(--color-bg-card)] w-full max-w-sm mx-5 p-7 border border-[var(--color-border)] shadow-[var(--shadow-lg)]"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
              style={{ borderRadius: "var(--radius-sm)" }}
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <>
                <h2
                  id="pricing-modal-title"
                  className="font-serif text-xl font-medium text-[var(--color-text-primary)] mb-2"
                >
                  购买成功
                </h2>
                <p className="font-sans text-[13px] text-[var(--color-text-muted)] mb-6">
                  {modalPlan.name}
                </p>
                <div
                  className="bg-[var(--color-bg-alt)] border border-[var(--color-border)] p-4 mb-7"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <p className="font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-2">
                    本次发放：
                  </p>
                  <ul className="font-serif text-[15px] leading-[1.7] text-[var(--color-text-body)] space-y-1">
                    {typeof success.granted.bazi === "number" && (
                      <li>· 八字解读 +{success.granted.bazi} 次</li>
                    )}
                    {typeof success.granted.liuyao === "number" && (
                      <li>· 六爻问卦 +{success.granted.liuyao} 次</li>
                    )}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    closeModal();
                    router.push("/panel");
                  }}
                  className="w-full py-[14px] font-sans text-[15px] font-medium bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-card)]"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  去使用
                </button>
              </>
            ) : (
              <>
                <h2
                  id="pricing-modal-title"
                  className="font-serif text-xl font-medium text-[var(--color-text-primary)] mb-2"
                >
                  确认购买
                </h2>
                <p className="font-sans text-[13px] text-[var(--color-text-muted)] mb-7">
                  {modalPlan.name}
                </p>

                {error && (
                  <p
                    className="mb-5 font-sans text-[13px] leading-[1.6] text-[var(--color-primary)] bg-[var(--color-bg-alt)] border border-[var(--color-primary)]/20 px-3 py-2"
                    style={{ borderRadius: "var(--radius-sm)" }}
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full py-[14px] font-sans text-[15px] font-medium bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-card)]"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  {paying ? "处理中…" : "确认购买"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
