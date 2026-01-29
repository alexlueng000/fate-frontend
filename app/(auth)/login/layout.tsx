import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '登录',
  description: '登录易凡文化账户，开启你的AI八字命理分析之旅，获取专属命盘解读和运势分析。',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
