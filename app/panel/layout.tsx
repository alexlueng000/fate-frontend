import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '命盘分析',
  description: '易凡文化AI命盘分析面板，输入出生信息即可获取专业八字排盘、五行分析、大运流年解读，与AI大师实时对话解惑。',
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
