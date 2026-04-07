import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import Footer from '@/app/components/Footer';
import { getArticleBySlug, articles, categoryColors } from '../data';
import ArticleContent from './ArticleContent';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} — 命理学堂`,
    description: article.summary,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = articles.filter(
    (a) => a.slug !== slug && a.category === article.category
  ).slice(0, 2);

  return (
    <main className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 返回 */}
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            命理学堂
          </Link>

          {/* 文章头部 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[article.category]}`}>
                {article.category}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime} 分钟阅读
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">{article.publishDate}</span>
            </div>
            <h1
              className="text-3xl font-bold text-[var(--color-text-primary)] mb-3 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {article.title}
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">{article.subtitle}</p>
          </div>

          {/* 摘要 */}
          <div className="card p-5 mb-8 bg-[var(--color-bg-deep)] border-l-4 border-[var(--color-gold)]">
            <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">{article.summary}</p>
          </div>

          {/* 正文 */}
          <ArticleContent content={article.content} />

          {/* 分割线 */}
          <div className="my-12 border-t border-[var(--color-border)]" />

          {/* 引导测算 */}
          <div className="card p-8 text-center mb-12 bg-gradient-to-br from-[var(--color-bg-deep)] to-white">
            <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              了解了命理基础，试试分析你的八字
            </p>
            <p className="text-[var(--color-text-muted)] text-sm mb-5">
              输入出生信息，AI 为你生成专属命理解读
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              免费生成我的命盘
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 相关文章 */}
          {related.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">相关文章</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {related.map((a) => (
                  <Link key={a.slug} href={`/knowledge/${a.slug}`} className="block group">
                    <div className="card p-5 hover:shadow-md transition-shadow">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[a.category]}`}>
                        {a.category}
                      </span>
                      <h3 className="font-medium text-[var(--color-text-primary)] mt-2 mb-1 group-hover:text-[var(--color-primary)] transition-colors text-sm">
                        {a.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)]">{a.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
