import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '示例报告',
  description: '查看易凡文化AI命理分析示例报告，了解八字命盘解读的专业深度和个性化分析风格。',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
