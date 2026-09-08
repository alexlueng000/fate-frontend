import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * FAQ preview section for the landing page.
 * Server-rendered with native <details>/<summary> so the content
 * is fully crawlable without JavaScript. Mirrors the FAQPage JSON-LD
 * injected in app/page.tsx.
 */

export const LANDING_FAQS = [
  {
    question: "什么是八字？",
    answer:
      "八字又称四柱，由出生年、月、日、时对应的天干地支组成。传统文化会通过五行、十神、格局等概念观察一个人的特质、节奏与关系结构。我们会尽量用白话解释这些概念，避免让术语成为理解门槛。",
  },
  {
    question: "我不懂八字，可以用吗？",
    answer:
      "可以。你不需要先学习天干地支、五行、十神这些术语，直接用自然语言提问即可。系统会尽量把传统文化概念翻译成更容易理解的表达，帮助你先看懂内容，再决定哪些部分对自己有参考价值。",
  },
  {
    question: "第一次使用需要准备什么？",
    answer:
      "如果你要生成八字文化分析，需要准备出生日期、出生时间和出生地点。时间越准确，排盘结果越稳定；如果暂时不确定具体时间，也可以先用大致时段体验，再根据需要补充修正。",
  },
  {
    question: "解读结果准确吗？",
    answer:
      "平台内容基于传统文化资料与 AI 生成能力整理而成，只能作为参考视角。它可以帮助你发现一些值得思考的线索，但不能保证结果，也不能替代你的经验、理性判断和现实信息。",
  },
  {
    question: "免费体验包含什么？",
    answer:
      "首次分析不需要注册。新注册账户可获得 10 次八字 AI 解读和 10 次六爻 AI 解卦额度。免费额度用完后，可以前往套餐与额度页面查看可选方案。",
  },
] as const;

export default function FaqPreview() {
  return (
    <section className="px-6 py-20 md:py-28" style={{ background: "var(--color-bg-elevated)" }}>
      <div className="mx-auto max-w-3xl space-y-12">
        <header className="space-y-3">
          <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            常见问题
          </p>
          <h2
            className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            开始之前，你可能想问。
          </h2>
          <p className="text-[1rem] leading-relaxed text-[var(--color-text-secondary)]">
            关于八字、六爻、AI 解读和账号额度的几个高频问题。
          </p>
        </header>

        <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          {LANDING_FAQS.map((faq, idx) => (
            <details
              key={faq.question}
              className="group border-t border-[var(--color-border)] first:border-t-0"
              open={idx === 0}
            >
              <summary className="grid w-full cursor-pointer list-none grid-cols-[auto_1fr] items-baseline gap-4 px-5 py-5 transition-colors hover:bg-[var(--color-bg-hover)] md:px-6 [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-[0.75rem] text-[var(--color-text-hint)] tabular-nums" aria-hidden="true">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[1rem] font-medium text-[var(--color-text-primary)]">
                  {faq.question}
                </span>
              </summary>
              <div className="grid grid-cols-[auto_1fr] gap-4 px-5 pb-6 text-[0.9375rem] leading-[1.8] text-[var(--color-text-secondary)] md:px-6">
                <span className="w-[1.75rem]" aria-hidden="true" />
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/faq"
            className="group inline-flex items-center gap-1 text-[0.9375rem] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            查看全部常见问题
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
