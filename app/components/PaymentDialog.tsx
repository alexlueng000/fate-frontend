'use client';

import { useEffect, useId, useRef } from 'react';
import { Check, LoaderCircle, MessageCircle, ScanLine, ShieldCheck, X } from 'lucide-react';
import type { WeChatCheckout } from '@/app/lib/wechat-payment';
import WeChatPaymentAction from './WeChatPaymentAction';

type Props = {
  checkout: WeChatCheckout;
  productName: string;
  qrDataUrl: string | null;
  error?: string | null;
  success?: { title: string; description: string; actionLabel: string };
  onClose: () => void;
  onComplete: () => void;
};

export default function PaymentDialog({ checkout, productName, qrDataUrl, error, success, onClose, onComplete }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const amount = (checkout.order.amount_cents / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  return (
    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); closeRef.current(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[400px] overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[#fdfbf8] p-0 text-[var(--color-text-primary)] shadow-2xl backdrop:bg-[#211d19]/50 backdrop:backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-3">
        <span className="text-xs tracking-[0.12em] text-[var(--color-text-secondary)]">易凡文化 · 订单支付</span>
        <button type="button" onClick={onClose} aria-label="关闭支付弹窗"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-6 pb-7 pt-6 text-center sm:px-8">
        {success ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf3ed] text-[#26734b]"><Check size={28} /></div>
            <h2 id={titleId} className="text-xl font-medium">{success.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{success.description}</p>
            <p className="mt-5 text-2xl font-semibold tabular-nums">¥{amount}</p>
            <button type="button" onClick={onComplete} className="mt-6 min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-white">{success.actionLabel}</button>
          </>
        ) : (
          <>
            <h2 id={titleId} className="text-base font-medium">{productName}</h2>
            <p className="mt-4 flex items-baseline justify-center gap-1.5 font-sans tabular-nums">
              <span className="text-xl">¥</span><span className="text-[44px] font-semibold leading-none tracking-tight">{amount}</span>
            </p>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">本次实付金额</p>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#26734b]">
              <MessageCircle size={18} />微信支付
            </div>
            {checkout.pay_params ? (
              <WeChatPaymentAction params={checkout.pay_params} />
            ) : (
              <>
                <div className="mx-auto mt-4 flex h-[200px] w-[200px] items-center justify-center rounded-2xl border border-[#e9e3db] bg-white p-3 shadow-sm">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="微信支付二维码" width={176} height={176} className="h-full w-full" />
                  ) : <LoaderCircle aria-label="正在生成二维码" size={28} className="animate-spin text-[var(--color-text-muted)]" />}
                </div>
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-text-body)]"><ScanLine size={16} /><span className="sm:hidden">请用另一台设备的微信扫码</span><span className="hidden sm:inline">打开微信扫一扫，完成付款</span></p>
                <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)] sm:hidden">不支持长按识别，也可在电脑上打开后扫码</p>
              </>
            )}
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-700">{error}</p>}
            <div className="mt-6 border-t border-dashed border-[var(--color-border)] pt-4">
              <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-secondary)]"><ShieldCheck size={14} />付款后自动开通权益，无需重复下单</p>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
