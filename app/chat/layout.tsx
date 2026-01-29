import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI命理对话',
  description: '与易凡文化AI进行命理对话，深入解读你的八字命盘，解答事业、感情、财运等人生困惑。',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
