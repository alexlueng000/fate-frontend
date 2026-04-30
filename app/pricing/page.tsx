"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, QrCode, Smartphone } from "lucide-react";
import { api, postJSON } from "@/app/lib/api";
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

type PayChannel = "WECHAT_NATIVE" | "ALIPAY_PC";

interface OrderOut {
  id: number;
  out_trade_no: string;
  status: string;
  amount_cents: number;
}

interface PaymentOut {
  id: number;
  channel: PayChannel;
  prepay_id: string | null;
  pay_url: string | null;
  status: string;
}

// 组合套餐
const plans: PricingPlan[] = [
  {
    id: "basic_combo",
    name: "基础套餐",
    description: "适合新用户体验完整功能",
    price: 99,
    features: [
      "10次八字解读",
      "30天心镜灯情绪追踪",
      "3次六爻问卦",
      "无限续聊追问",
      "AI智能分析",
      "专业命理知识库",
      "永久有效",
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
      "50次八字解读",
      "180天心镜灯情绪追踪",
      "15次六爻问卦",
      "无限续聊追问",
      "AI智能分析",
      "专业命理知识库",
      "永久有效",
      "超值优惠25%",
      "赠送专属客服",
    ],
    buttonText: "立即购买",
    buttonStyle: "primary",
    popular: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 支付弹窗状态
  const [modalPlan, setModalPlan] = useState<PricingPlan | null>(null);
  const [payChannel, setPayChannel] = useState<PayChannel>("ALIPAY_PC");
  const [paying, setPaying] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);

  function authHeaders(): Record<string, string> {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function openModal(plan: PricingPlan) {
    const token = getAuthToken();
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }
    setModalPlan(plan);
    setError(null);
    setOrderId(null);
    setPolling(false);
  }

  function closeModal() {
    setModalPlan(null);
    setError(null);
    setPaying(false);
    setOrderId(null);
    setPolling(false);
  }

  async function handlePay() {
    if (!modalPlan) return;
    setPaying(true);
    setError(null);

    try {
      // 1. 创建订单
      const order = await postJSON<OrderOut>(
        api("/orders"),
        { product_code: modalPlan.id },
        { headers: authHeaders() }
      );

      // 2. 创建预支付
      const payment = await postJSON<PaymentOut>(
        api("/payments/prepay"),
        { order_id: order.id, channel: payChannel },
        { headers: authHeaders() }
      );

      setOrderId(order.id);

      if (payChannel === "ALIPAY_PC" && payment.pay_url) {
        // 支付宝：跳转到支付宝收银台
        window.location.href = payment.pay_url;
      } else {
        // 微信 / 其他：轮询订单状态
        startPolling(order.id);
      }
    } catch (e: unknown) {
      setError((e as Error).message || "支付请求失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  }

  function startPolling(oid: number) {
    setPolling(true);
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(api(`/orders/${oid}`), { headers, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID") {
            clearInterval(timer);
            setPolling(false);
            closeModal();
            router.push("/panel?payment=success");
          }
        }
      } catch {
        // 忽略网络错误，继续轮询
      }

      if (attempts >= 30) {
        // 60 秒超时
        clearInterval(timer);
        setPolling(false);
        setError("支付超时，如已付款请联系客服");
      }
    }, 2000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* 标题 */}
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
        </div>

        {/* 套餐卡片 */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm transition-all hover:shadow-xl ${
                plan.popular
                  ? "border-orange-500 scale-105"
                  : "border-slate-200"
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
                disabled={loading === plan.id}
                className={`w-full rounded-lg px-6 py-4 text-base font-semibold transition-colors mb-8 ${
                  plan.buttonStyle === "primary"
                    ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300"
                    : "border-2 border-slate-900 text-slate-900 hover:bg-slate-50 disabled:border-slate-300 disabled:text-slate-400"
                }`}
              >
                {loading === plan.id ? "处理中..." : plan.buttonText}
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

        {/* FAQ */}
        <div className="mt-20 border-t border-slate-200 pt-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            常见问题
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                套餐包含哪些功能？
              </h3>
              <p className="text-sm text-slate-600">
                每个套餐都包含八字解读、心镜灯情绪追踪和六爻问卦三大功能，让你全方位探索命理。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                次数会过期吗？
              </h3>
              <p className="text-sm text-slate-600">
                不会！购买的次数永久有效，随时可以使用，没有时间限制。心镜灯的天数从激活时开始计算。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                支持哪些支付方式？
              </h3>
              <p className="text-sm text-slate-600">
                支持支付宝和微信支付，安全便捷，支付成功后次数立即到账。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                可以退款吗？
              </h3>
              <p className="text-sm text-slate-600">
                未使用的次数支持 7
                天内无理由退款，已使用的次数不支持退款。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {modalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 蒙层 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            {/* 关闭按钮 */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">
              确认购买
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              {modalPlan.name} · ¥{modalPlan.price}
            </p>

            {/* 支付方式选择 */}
            <p className="text-sm font-medium text-slate-700 mb-3">选择支付方式</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setPayChannel("ALIPAY_PC")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 transition-all ${
                  payChannel === "ALIPAY_PC"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl font-bold text-blue-600">支</span>
                <span className="text-xs font-semibold text-slate-700">支付宝</span>
              </button>
              <button
                onClick={() => setPayChannel("WECHAT_NATIVE")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 transition-all ${
                  payChannel === "WECHAT_NATIVE"
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <QrCode className="w-7 h-7 text-green-600" />
                <span className="text-xs font-semibold text-slate-700">微信支付</span>
              </button>
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {polling && (
              <p className="mb-4 text-sm text-slate-500 text-center">
                等待支付结果...
              </p>
            )}

            <button
              onClick={handlePay}
              disabled={paying || polling}
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
            >
              {paying ? "处理中..." : polling ? "等待确认..." : `立即支付 ¥${modalPlan.price}`}
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
