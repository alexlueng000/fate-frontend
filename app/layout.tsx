import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Noto_Serif_SC } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const notoSerifSC = Noto_Serif_SC({
  variable: '--font-noto-serif-sc',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fateinsight.site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '易凡文化 - AI八字排盘与性格分析',
    template: '%s | 易凡文化',
  },
  description:
    '易凡文化融合传统文化与AI技术，提供八字排盘、白话命盘解读、情绪记录与六爻文化参考。输入出生信息，免费生成首次分析，用东方视角重新认识自己的性格与节奏。',
  keywords: [
    '八字',
    '八字排盘',
    '八字入门',
    '四柱',
    '性格分析',
    '五行',
    '天干地支',
    '日主',
    '六爻',
    '情绪记录',
    'AI解读',
    '传统文化',
    '易凡文化',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: '易凡文化',
    title: '易凡文化 - AI八字排盘与性格分析',
    description:
      '输入出生信息，免费生成首次八字分析。融合传统命理与AI，帮你把性格、情绪和选择整理得更清楚。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '易凡文化 - AI八字排盘与性格分析',
    description:
      '输入出生信息，免费生成首次八字分析。融合传统命理与AI，帮你把性格、情绪和选择整理得更清楚。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSerifSC.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
