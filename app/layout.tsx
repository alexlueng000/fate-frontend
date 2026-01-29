import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: '易凡文化 - AI八字命理分析平台',
    template: '%s | 易凡文化',
  },
  description: '易凡文化 - 专业AI八字算命平台，融合传统命理智慧与人工智能技术，提供个性化命盘分析、大运流年解读，助你认识自我、把握时机。',
  keywords: ['八字算命', 'AI算命', '命理分析', '八字排盘', '大运流年', '易凡文化', '在线算命', '命盘解读'],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
