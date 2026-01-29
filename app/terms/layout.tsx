import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服务条款',
  description: '易凡文化服务条款，使用本平台前请仔细阅读，了解您的权利和义务。',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
