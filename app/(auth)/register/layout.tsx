import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '注册',
  description: '注册易凡文化账户，免费体验AI八字命理分析，获取个性化命盘解读和大运流年预测。',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
