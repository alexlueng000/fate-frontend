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
  unit: string;
  quota: number;
  features: string[];
  buttonText: string;
  buttonStyle: "outline" | "primary" | "secondary";
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

const plans: PricingPlan[] = [
  {
    id: "chat_5",
    name: "体验包",
    description: "适合新用户体验命理解读",
    price: 9.9,
    unit: "5次",
    quota: 5,
    features: [
      "5次完整八字解读",
      "无限续聊追问",
      "AI智能分析",
      "专业命理知识库",
      "永久有效",
    ],
    buttonText: "立即购买",
    buttonStyle: "outline",
  },
  {
    id: "chat_20",
    name: "标准包",
    badge: "最受欢迎",
    description: "适合日常使用，深度探索命理",
    price: 29.9,
    originalPrice: 39.6,
    unit: "20次",
    quota: 20,
    features: [
      "20次完整八字解读",
      "无限续聊追问",
      "AI智能分析",
      "专业命理知识库",
      "永久有效",
      "平均每次仅¥1.5",
    ],
    buttonText: "立即购买",
    buttonStyle: "primary",
    popular: true,
  },
  {
    id: "chat_50",
    name: "超值包",
    description: "适合深度用户，全面了解命运",
    price: 59.9,
    originalPrice: 99,
    unit: "50次",
    quota: 50,
    features: [
      "50次完整八字解读",
      "无限续聊追问",
      "AI智能分析",
      "专业命理知识库",
      "永久有效",
      "平均每次仅¥1.2",
      "超值优惠40%",
    ],
    buttonText: "立即购买",
    buttonStyle: "outline",
  },
  {
    id: "chat_200",
    name: "年度包",
    description: "适合长期用户，全年无忧",
    price: 199,
    originalPrice: 396,
    unit: "200次",
    quota: 200,
    features: [
      "200次完整八字解读",
      "无限续聊追问",
      "AI智能分析",
      "专业命理知识库",
      "永久有效",
      "平均每次仅¥1.0",
      "超值优惠50%",
      "赠送专属客服",
    ],
    buttonText: "立即购买",
    buttonStyle: "secondary",
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
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
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
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            选择适合你的套餐
          </h1>
          <p className="text-lg text-slate-600">
            开始你的命理探索之旅，
            <span className="font-semibold text-slate-900">
              新用户赠送 3 次免费体验
            </span>
            ，无需信用卡
          </p>
        </div>

        {/* 套餐卡片 */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-lg ${
                plan.popular
                  ? "border-orange-500 scale-105 lg:scale-110"
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

              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">
                    ¥{plan.price}
                  </span>
                  <span className="ml-2 text-sm text-slate-600">/{plan.unit}</span>
                </div>
                {plan.originalPrice && (
                  <div className="mt-1">
                    <span className="text-sm text-slate-400 line-through">
                      原价 ¥{plan.originalPrice}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => openModal(plan)}
                disabled={loading === plan.id}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  plan.buttonStyle === "primary"
                    ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300"
                    : plan.buttonStyle === "secondary"
                    ? "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400"
                    : "border-2 border-slate-900 text-slate-900 hover:bg-slate-50 disabled:border-slate-300 disabled:text-slate-400"
                }`}
              >
                {loading === plan.id ? "处理中..." : plan.buttonText}
              </button>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 flex-shrink-0 text-orange-500 mr-3" />
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
                什么是"次数"？
              </h3>
              <p className="text-sm text-slate-600">
                每次开始新的八字解读消耗 1
                次，但解读后的追问和续聊不消耗次数，可以无限深入探讨。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                次数会过期吗？
              </h3>
              <p className="text-sm text-slate-600">
                不会！购买的次数永久有效，随时可以使用，没有时间限制。
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
              {modalPlan.name} · {modalPlan.unit} · ¥{modalPlan.price}
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
