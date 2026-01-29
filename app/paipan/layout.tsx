import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '八字排盘',
  description: '易凡文化在线八字排盘工具，输入出生时间地点，精准计算四柱八字、大运流年、五行分析。',
};

export default function PaipanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
