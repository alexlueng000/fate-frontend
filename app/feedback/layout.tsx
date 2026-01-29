import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '意见反馈',
  description: '向易凡文化团队提交意见反馈，帮助我们改进产品体验，您的建议是我们进步的动力。',
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
