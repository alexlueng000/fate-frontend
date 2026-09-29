'use client';

import { useEffect } from 'react';
import { api, authHeaders, postJSON, createWeChatNativeCheckout, type WeChatNativeCheckoutResult } from './api';

export type WeChatPayParams = {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
};
export type WeChatCheckout = WeChatNativeCheckoutResult & { pay_params?: WeChatPayParams };
const PENDING_KEY = 'wechat_payment_oauth';

export async function startWeChatCheckout(productCode: string): Promise<WeChatCheckout | null> {
  if (!/MicroMessenger/i.test(navigator.userAgent)) return createWeChatNativeCheckout(productCode);
  const result = await postJSON<{ url: string; state: string; ticket: string }>(
    api('/payments/wechat/jsapi/authorize'),
    { product_code: productCode, redirect_uri: window.location.origin + window.location.pathname },
    { headers: authHeaders() },
  );
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ state: result.state, ticket: result.ticket }));
  window.location.assign(result.url);
  return null;
}

export function useWeChatPaymentReturn(
  onCheckout: (checkout: WeChatCheckout) => void,
  onError: (error: string) => void,
) {
  useEffect(() => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get('state');
    const stored = sessionStorage.getItem(PENDING_KEY);
    if (!state || !stored) return;
    const code = url.searchParams.get('code');
    // Consume synchronously, including in React Strict Mode. Never retry a used OAuth code.
    sessionStorage.removeItem(PENDING_KEY);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState(window.history.state, '', url.toString());
    try {
      const pending = JSON.parse(stored) as { state: string; ticket: string };
      if (pending.state !== state || !code) throw new Error('微信支付授权失败，请重新选择套餐。');
      void postJSON<WeChatCheckout>(api('/payments/wechat/jsapi'),
        { code, state, ticket: pending.ticket }, { headers: authHeaders() },
      ).then(onCheckout).catch((error: unknown) => onError(
        error instanceof Error ? error.message : '微信支付授权失败，请重新选择套餐。',
      ));
    } catch (error) {
      onError(error instanceof Error ? error.message : '微信支付授权失败，请重新选择套餐。');
    }
  }, [onCheckout, onError]);
}

type Bridge = {
  invoke: (method: string, params: WeChatPayParams, callback: (result: { err_msg: string }) => void) => void;
};

export function invokeWeChatPay(params: WeChatPayParams): Promise<'ok' | 'cancel'> {
  return new Promise((resolve, reject) => {
    const getBridge = () => (window as Window & { WeixinJSBridge?: Bridge }).WeixinJSBridge;
    const cleanup = () => {
      clearTimeout(timer);
      document.removeEventListener('WeixinJSBridgeReady', ready);
    };
    const ready = () => {
      const bridge = getBridge();
      if (!bridge) return;
      cleanup();
      try {
        bridge.invoke('getBrandWCPayRequest', params, (result) => {
          if (result.err_msg === 'get_brand_wcpay_request:ok') resolve('ok');
          else if (result.err_msg === 'get_brand_wcpay_request:cancel') resolve('cancel');
          else reject(new Error('微信支付未完成，请重试；若持续失败请联系管理员。'));
        });
      } catch {
        reject(new Error('无法调起微信支付，请在微信中重新打开页面。'));
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('微信支付组件未就绪，请在微信中重新打开页面。'));
    }, 10000);
    document.addEventListener('WeixinJSBridgeReady', ready);
    ready();
  });
}
