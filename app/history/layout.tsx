import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '我的解读记录',
  description: '查看你的八字与六爻历史解读记录，随时回顾或继续追问。',
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
