'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Target, Bot, MessageCircle, AlertTriangle, Mail, AtSign } from 'lucide-react';
import Footer from '@/app/components/Footer';

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
        {/* 返回链接 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {/* Logo 和版本 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 overflow-hidden">
            
          <h1
            className="text-4xl font-bold text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            易凡文化
          </h1>
          <p className="text-[var(--color-text-muted)]">版本 1.0.0</p>
        </div>

        {/* 内容 */}
        <div className="space-y-6">
          {/* 关于我们 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              关于我们
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              易凡文化是一款基于中国传统文化与AI技术的智能解读平台。
              我们致力于将传统文化与现代科技结合，为用户提供有趣、有料的性格分析与解读服务。
            </p>
          </div>

          {/* 功能特点 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
              功能特点
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-bg-hover)] flex items-center justify-center">
                  <Target className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">精准分析</h3>
                  <p className="text-[var(--color-text-secondary)]">支持公历/农历，自动分析</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-bg-hover)] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">AI解读</h3>
                  <p className="text-[var(--color-text-secondary)]">智能分析性格、事业、感情</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-bg-hover)] flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[var(--color-tech)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">多轮对话</h3>
                  <p className="text-[var(--color-text-secondary)]">深入探讨您关心的话题</p>
                </div>
              </div>
            </div>
          </div>

          {/* 温馨提示 */}
          <div className="card p-8 border-[var(--color-primary)] bg-red-50">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-[var(--color-primary)]" />
              <h2 className="text-2xl font-bold text-[var(--color-primary)]">
                温馨提示
              </h2>
            </div>
            <p className="text-[var(--color-primary)]">
              本应用提供的分析内容仅供娱乐参考，不构成任何专业建议。请理性对待，相信科学。
            </p>
          </div>

          {/* 联系我们 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
              联系我们
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--color-bg-hover)] rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)]">客服邮箱</span>
                </div>
                <span className="text-[var(--color-primary)] font-medium">support@fateinsight.site</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--color-bg-hover)] rounded-xl">
                <div className="flex items-center gap-3">
                  <AtSign className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)]">微信公众号</span>
                </div>
                <span className="text-[var(--color-primary)] font-medium">FateInsight</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
