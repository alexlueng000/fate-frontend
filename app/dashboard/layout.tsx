import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '今日命理工作台',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
