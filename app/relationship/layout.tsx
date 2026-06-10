import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '感情关系',
};

export default function RelationshipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
