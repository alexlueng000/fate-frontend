'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import Footer from '@/app/components/Footer';

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold text-[var(--color-text-primary)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            联系我们
          </h1>
          <p className="text-[var(--color-text-muted)]">
            我们随时准备为您提供帮助
          </p>
        </div>

        <div className="space-y-4">
          <div className="card p-6 flex items-center gap-4 hover:border-[var(--color-primary)]/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                电子邮件
              </h3>
              <a
                href="mailto:support@fateinsight.site"
                className="text-[var(--color-primary)] hover:underline"
              >
                support@fateinsight.site
              </a>
            </div>
          </div>

          <div className="card p-6 flex items-center gap-4 hover:border-[var(--color-gold)]/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-light)] flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                在线客服
              </h3>
              <p className="text-[var(--color-text-muted)]">
                工作日 9:00 - 18:00
              </p>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-hover)]">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">
              常见问题
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3">
              在联系我们之前，您可以先查看以下常见问题：
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>• 如何注册账号？请访问<Link href="/register" className="text-[var(--color-primary)] hover:underline">注册页面</Link></li>
              <li>• 如何使用服务？完成注册后，在<Link href="/panel" className="text-[var(--color-primary)] hover:underline">控制面板</Link>输入出生信息即可</li>
              <li>• 数据安全吗？请查看我们的<Link href="/privacy" className="text-[var(--color-primary)] hover:underline">隐私政策</Link></li>
              <li>• 服务条款？请查看<Link href="/terms" className="text-[var(--color-primary)] hover:underline">服务条款</Link></li>
            </ul>
          </div>

          <div className="card p-6 text-center">
            <p className="text-[var(--color-text-secondary)] text-sm">
              我们通常会在 <strong>1-2 个工作日</strong> 内回复您的邮件
            </p>
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
