import Link from 'next/link';
import { ArrowLeft, Clock, BookOpen, ChevronRight } from 'lucide-react';
import Footer from '@/app/components/Footer';
import { articles, categoryColors } from './data';

export const metadata = {
  title: '命理学堂 — 易凡文化',
  description: '系统学习八字命理基础知识，探索名人八字案例，理解五行与大运流年。',
};

export default function KnowledgePage() {
  const featured = articles[0];
  const rest = articles.slice(1);

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <main className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* 返回 */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          {/* 页头 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] mb-6">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-4xl font-bold text-[var(--color-text-primary)] mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              命理学堂
            </h1>
            <p className="text-[var(--color-text-muted)] max-w-xl mx-auto">
              从零开始，系统了解八字命理的核心概念与实际应用
            </p>
          </div>

          {/* 分类筛选（纯展示） */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            <span className="px-4 py-1.5 rounded-full text-sm bg-[var(--color-primary)] text-white font-medium">
              全部
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-1.5 rounded-full text-sm bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* 精选文章（大卡片） */}
          <Link href={`/knowledge/${featured.slug}`} className="block mb-8 group">
            <div className="card p-8 hover:shadow-xl transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[featured.category]}`}>
                      {featured.category}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featured.readTime} 分钟
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">精选</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-1">{featured.subtitle}</p>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mt-3">
                    {featured.summary}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center text-[var(--color-primary)] gap-1 font-medium text-sm md:pt-2">
                  阅读全文
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* 文章列表 */}
          <div className="grid md:grid-cols-2 gap-6">
            {rest.map((article) => (
              <Link key={article.slug} href={`/knowledge/${article.slug}`} className="block group">
                <div className="card p-6 h-full hover:shadow-lg transition-shadow flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[article.category]}`}>
                      {article.category}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime} 分钟
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] mb-3">{article.subtitle}</p>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
                    {article.summary}
                  </p>
                  <div className="mt-4 flex items-center text-[var(--color-primary)] text-sm font-medium gap-1">
                    阅读
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 底部引导 */}
          <div className="mt-16 text-center p-8 card bg-gradient-to-br from-[var(--color-bg-deep)] to-white">
            <p className="text-[var(--color-text-secondary)] mb-4">
              学完基础知识，试试分析你自己的八字
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              免费生成我的命盘
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
