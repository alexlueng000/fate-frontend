import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '常见问题',
  description: '易凡文化常见问题解答，了解八字命理分析的原理、使用方法、付费说明等常见疑问。',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
