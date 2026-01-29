import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '我的账户',
  description: '管理你的易凡文化账户，查看历史命盘记录、对话历史，修改个人信息。',
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
