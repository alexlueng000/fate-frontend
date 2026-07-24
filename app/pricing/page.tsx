import { redirect } from 'next/navigation';

/**
 * 商品价格、权益和支付流程统一由会员中心维护。
 * 保留 /pricing 作为兼容入口，避免旧链接失效。
 */
export default function PricingPage() {
  redirect('/membership');
}
