import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '命理首页',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
