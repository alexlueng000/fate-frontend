import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '免费体验',
  description: '免费体验易凡文化AI八字命理分析，输入出生信息即刻获取专属命盘解读，无需注册。',
};

export default function TryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
