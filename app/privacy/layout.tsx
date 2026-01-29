import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策',
  description: '易凡文化隐私政策，了解我们如何收集、使用和保护您的个人信息，保障您的数据安全。',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
