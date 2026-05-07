"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Sparkles } from "lucide-react";
import { simulatePayment, SimulatePaymentResult } from "@/app/lib/api";
import { getAuthToken } from "@/app/lib/auth";
import Footer from "@/app/components/Footer";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  price: number;
  originalPrice?: number;
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
    price: 99,
    features: [
      "10 次八字 AI 解读（含开场与追问）",
      "30 天心镜灯情绪追踪",
      "3 次六爻 AI 解读（含起卦与追问）",
      "DeepSeek 智能分析",
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
    price: 299,
    originalPrice: 398,
    features: [
      "50 次八字 AI 解读（含开场与追问）",
      "180 天心镜灯情绪追踪",
      "15 次六爻 AI 解读（含起卦与追问）",
      "DeepSeek 智能分析",
      "专业命理知识库",
      "次数永久有效",
      "超值优惠 25%",
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            选择适合你的套餐
          </h1>
          <p className="text-lg text-slate-600 mb-6">
            三大功能组合，一站式命理探索体验
          </p>
          <div className="inline-flex items-center gap-6 text-sm text-slate-600 bg-white rounded-2xl px-8 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">☰</span>
              <span>八字解读</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪷</span>
              <span>心镜灯</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚊</span>
              <span>六爻问卦</span>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            模拟支付 · 测试用，次数立即到账
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm transition-all hover:shadow-xl ${
                plan.popular ? "border-orange-500 scale-105" : "border-slate-200"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-orange-500 px-4 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-slate-900">
                    ¥{plan.price}
                  </span>
                </div>
                {plan.originalPrice && (
                  <div className="mt-2">
                    <span className="text-sm text-slate-400 line-through">
                      原价 ¥{plan.originalPrice}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => openModal(plan)}
                className={`w-full rounded-lg px-6 py-4 text-base font-semibold transition-colors mb-8 ${
                  plan.buttonStyle === "primary"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "border-2 border-slate-900 text-slate-900 hover:bg-slate-50"
                }`}
              >
                {plan.buttonText}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 flex-shrink-0 text-orange-500 mr-3 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 border-t border-slate-200 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            常见问题
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                "1 次解读" 怎么算？
              </h3>
              <p className="text-sm text-slate-600">
                每次让 AI 生成一段解读都算 1 次:首次开场、点击快捷分析、输入框追问都是。重新生成上一段回复 <span className="font-medium">不</span>额外计费。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                次数会过期吗？
              </h3>
              <p className="text-sm text-slate-600">
                不会。购买的八字 / 六爻次数永久有效,随时使用。心镜灯的天数从首次启用当日开始计算。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                当前为什么是模拟支付？
              </h3>
              <p className="text-sm text-slate-600">
                正式的微信 / 支付宝通道仍在接入中。在此期间,套餐次数会在你点击购买后立即到账,方便测试与体验。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                可以退款吗？
              </h3>
              <p className="text-sm text-slate-600">
                未使用的次数支持 7 天内无理由退款;已使用的次数不支持退款。
              </p>
            </div>
          </div>
        </div>
      </div>

      {modalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  购买成功
                </h2>
                <p className="text-sm text-slate-500 mb-5">
                  {modalPlan.name} · ¥{modalPlan.price}
                </p>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mb-6">
                  <p className="text-sm text-emerald-800 font-medium mb-2">
                    本次发放：
                  </p>
                  <ul className="text-sm text-emerald-700 space-y-1">
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
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  去使用
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  确认购买
                </h2>
                <p className="text-sm text-slate-500 mb-5">
                  {modalPlan.name} · ¥{modalPlan.price}
                </p>

                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-6">
                  <p className="text-xs text-amber-800">
                    当前为模拟支付，点击下方按钮后次数立即到账，无需实际付款。
                  </p>
                </div>

                {error && (
                  <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
                >
                  {paying ? "处理中..." : `模拟支付 ¥${modalPlan.price}`}
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
