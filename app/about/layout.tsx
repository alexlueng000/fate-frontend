import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们',
  description: '了解易凡文化团队，我们致力于将传统命理智慧与现代AI技术相结合，为用户提供专业、严谨的命理分析服务。',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
