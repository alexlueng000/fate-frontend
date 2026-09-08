import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Footer from "@/app/components/Footer";

const BELIEFS = [
  "提供参考，不替你下结论",
  "以白话解释传统文化",
  "保护你的个人资料与使用记录",
] as const;

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-20" style={{ background: "var(--color-bg)" }}>
      <section className="px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-[0.75rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              About Yifan
            </p>
            <h1
              className="max-w-3xl text-[2rem] leading-[1.22] font-medium text-[var(--color-text-primary)] md:text-[3rem] lg:text-[3.5rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              让传统文化，
              <span className="block text-[var(--color-primary)]">成为理解自己的另一种方法。</span>
            </h1>
          </div>

          <div className="space-y-6 border-t border-[var(--color-border)] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <p className="text-[1rem] leading-[1.8] text-[var(--color-text-body)] md:text-[1.0625rem]">
              易凡文化是一款基于中国传统文化与 AI 技术的智能解读平台。我们关注八字、六爻、情绪记录等内容在当代生活里的表达方式，希望把它们从神秘化、营销化和过度断言里拿出来，变成一种更安静、更清晰的自我理解工具。
            </p>
            <p className="text-[0.9375rem] leading-[1.8] text-[var(--color-text-secondary)]">
              在产品中，AI 主要承担资料整理、结构化生成和术语解释的工作。它会把传统文化中的复杂概念转译成更容易阅读的语言，帮助你从性格特质、生活节奏、关系模式和具体问题中，看见一些平时容易被忽略的线索。
            </p>
            <p className="text-[0.9375rem] leading-[1.8] text-[var(--color-text-secondary)]">
              我们不希望用“注定”“必然”这类词替用户下判断。易凡文化提供的是参考视角，不是人生裁决；最终的选择、行动与生活方向，始终应该回到你自己的经验、理性和现实处境中。
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-8">
            <header className="space-y-3">
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Principles
              </p>
              <h2
                className="text-[1.75rem] leading-[1.3] font-medium text-[var(--color-text-primary)] md:text-[2.25rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                我们相信，好的解读应该让人更自由。
              </h2>
            </header>

            <ol className="space-y-5">
              {BELIEFS.map((item, idx) => (
                <li
                  key={item}
                  className="grid grid-cols-[auto_1fr] items-baseline gap-4 border-t border-[var(--color-border)] pt-5 first:border-t-0 first:pt-0"
                >
                  <span className="font-mono text-[0.75rem] text-[var(--color-primary)] tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[1.125rem] font-medium text-[var(--color-text-primary)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-8">
            <div className="mb-6 flex h-10 w-10 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)]">
              <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <h2
              className="text-[1.375rem] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              内容边界
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-[1.8] text-[var(--color-text-body)]">
              本平台内容由 AI 基于传统文化资料生成，仅供文化研究、娱乐与个人参考，不构成医疗、投资、法律或其他专业建议。
            </p>
            <p className="mt-4 text-[0.875rem] leading-[1.7] text-[var(--color-text-secondary)]">
              如果你正面对疾病、财务、法律或重大心理压力，请优先寻求对应领域的专业帮助。
            </p>
          </aside>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20" style={{ background: "var(--color-bg-alt)" }}>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <Sparkles className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <h2
              className="text-[1.75rem] leading-[1.3] font-medium text-[var(--color-text-primary)] md:text-[2.25rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              从一次个人分析开始。
            </h2>
            <p className="max-w-xl text-[0.9375rem] leading-[1.8] text-[var(--color-text-secondary)]">
              先填写出生信息，获得一份关于个人特质、生活节奏和当前主题的传统文化参考。
            </p>
          </div>

          <div className="space-y-5 lg:justify-self-end">
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary group">
                免费生成个人分析
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link href="/pricing" className="btn btn-secondary group">
                查看套餐与额度
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>

            <address className="space-y-3 not-italic">
              <a
                href="mailto:windy46825@163.com"
                className="flex items-center gap-3 text-[0.875rem] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>客服邮箱：windy46825@163.com</span>
              </a>
              <p className="flex items-center gap-3 text-[0.875rem] text-[var(--color-text-secondary)]">
                <AtSign className="h-4 w-4" aria-hidden="true" />
                <span>微信公众号：FateInsight</span>
              </p>
            </address>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
