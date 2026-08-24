import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { articles } from "@/app/knowledge/data";

/**
 * Knowledge base preview on the landing page.
 * Server component — pulls article metadata from the knowledge data
 * module to build internal links to /knowledge/[slug], improving
 * crawl depth and long-tail keyword coverage.
 */
export default function KnowledgePreview() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="space-y-3">
          <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            传统文化学堂
          </p>
          <h2
            className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            先读懂概念，再用好工具。
          </h2>
          <p className="max-w-2xl text-[1rem] leading-relaxed text-[var(--color-text-secondary)]">
            我们整理了八字入门、五行详解、大运流年等系列内容，用白话讲清传统文化概念，帮你从零开始建立自己的理解框架。
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/knowledge/${article.slug}`}
              className="card group flex flex-col gap-4 p-5 transition-colors hover:bg-[var(--color-bg-hover)]"
            >
              <div className="flex items-center justify-between">
                <span className="border border-[var(--color-border)] px-2 py-0.5 text-[0.6875rem] tracking-wide text-[var(--color-text-secondary)]">
                  {article.category}
                </span>
                <span className="text-[0.6875rem] text-[var(--color-text-hint)]">
                  约 {article.readTime} 分钟
                </span>
              </div>
              <div className="space-y-2">
                <h3
                  className="text-[1.0625rem] font-medium leading-snug text-[var(--color-text-primary)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {article.title}
                </h3>
                <p className="text-[0.8125rem] leading-[1.7] text-[var(--color-text-muted)]">
                  {article.subtitle}
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[0.8125rem] font-medium text-[var(--color-primary)]">
                阅读全文
                <ChevronRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>

        <div>
          <Link
            href="/knowledge"
            className="group inline-flex items-center gap-1 text-[0.9375rem] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            进入传统文化学堂
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
