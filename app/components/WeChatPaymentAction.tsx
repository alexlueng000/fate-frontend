'use client';

import { useState } from 'react';
import { invokeWeChatPay, type WeChatPayParams } from '@/app/lib/wechat-payment';

export default function WeChatPaymentAction({ params }: { params: WeChatPayParams }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('点击按钮，在微信中确认付款。');
  async function pay() {
    setBusy(true);
    try {
      const result = await invokeWeChatPay(params);
      setMessage(result === 'cancel' ? '已取消付款，可点击按钮继续支付。' : '正在确认订单，请稍候。');
      // Entitlements and success UI remain driven by the server's order status.
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '支付未完成，请重试。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4 text-center">
      <button type="button" disabled={busy} onClick={() => void pay()}
        className="min-h-12 w-full rounded-xl bg-[#238653] transition-colors hover:bg-[#1b7044] px-5 text-[15px] font-medium text-white disabled:opacity-50">
        {busy ? '正在支付…' : '微信支付'}
      </button>
      <p role="status" className="mt-3 text-xs leading-6 text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}
