import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '联系我们',
  description: '联系易凡文化团队，商务合作、技术支持、用户咨询，我们随时为您服务。',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
