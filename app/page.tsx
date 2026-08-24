import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import FeatureShowcase from "@/app/components/landing/FeatureShowcase";
import AuthGate from "@/app/components/landing/AuthGate";
import { PrimaryCta, SecondaryCta } from "@/app/components/landing/LandingCtas";
import { Gift } from "lucide-react";

const HERO_ENTRIES = [
  {
    id: "bazi",
    eyebrow: "认识自己",
    title: "八字分析",
    desc: "适合你想了解长期的自己：性格底色、关系模式、做事节奏、容易卡住的地方，以及更适合你的发力方式。",
    helper: "你只需要提供出生日期、时间和地点。系统会完成八字排盘，并用更日常的语言解释其中的结构。",
    points: ["性格倾向", "关系模式", "事业方向", "人生阶段", "长期节奏"],
    href: "/analysis/start",
    cta: "开始看我的八字",
  },
  {
    id: "liuyao",
    eyebrow: "看一件具体的事",
    title: "六爻起卦",
    desc: "适合你正面对一个明确问题：一段关系要不要继续、某个机会值不值得投入、一次合作是否顺畅，或者一个选择该如何看待。",
    helper: "你写下问题，完成起卦后，系统会围绕这件事本身，分析当前状态、关键影响、可能变化和需要留意的地方。",
    points: ["感情关系", "工作机会", "合作推进", "选择判断", "近期进展"],
    href: "/liuyao",
    cta: "开始问一件事",
  },
] as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fateinsight.site";

export const metadata: Metadata = {
  title: "AI八字分析与六爻起卦平台 | 易凡文化",
  description:
    "易凡文化用传统方法结合 AI 分析，提供在线八字分析、八字排盘、六爻起卦与六爻解卦，帮你把性格、关系、选择和当下的问题整理得更清楚。",
  alternates: {
    canonical: '/',
  },
};

/** Structured data: Organization + WebSite. */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "易凡文化",
        url: SITE_URL,
        description:
          "融合传统文化与 AI 技术的八字排盘、性格分析与情绪记录平台。",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "易凡文化",
        inLanguage: "zh-CN",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <StructuredData />
      <AuthGate />

      {/* ========== HERO ========== */}
      <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* 左：主文案 */}
          <div className="animate-fade-in space-y-7">
            <p className="text-[0.75rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              AI · 东方文化 · 自我观察
            </p>

            <h1
              className="text-[1.75rem] leading-[1.25] font-medium md:text-[2.25rem] lg:text-[2.5rem]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-primary)",
              }}
            >
              用东方视角，
              <br className="hidden md:block" />
              看清<span style={{ color: "var(--color-primary)" }}>自己</span>，也看清事情。
            </h1>

            <p className="max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-body)] md:text-[1.0625rem]">
              八字观察自己，六爻观察事情。用传统方法结合 AI 分析，帮你把性格、关系、选择和当下的问题整理得更清楚。
            </p>

            <div className="inline-flex items-center gap-2 border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-3 py-2 text-[0.875rem] font-medium text-[var(--color-primary)]">
              <Gift className="h-4 w-4" aria-hidden="true" />
              新用户注册即享：八字解读 10 次 + 六爻参考 10 次
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <PrimaryCta entry="hero">开始看我的八字</PrimaryCta>
              <SecondaryCta entry="hero" event="home_liuyao_cta_click" href="/liuyao">
                开始问一件事
              </SecondaryCta>
            </div>

            {/* 信任注脚 · 排版式而非图标堆 */}
            <p className="pt-2 text-[0.8125rem] text-[var(--color-text-muted)]">
              AI 生成内容 · 供文化参考 ·
              <span className="ml-1">个人资料可管理和删除</span>
            </p>
          </div>

          {/* 右：首次路径 · 静态、克制 */}
          <aside className="animate-fade-in delay-200">
            <div className="card overflow-hidden">
              <header className="space-y-2 border-b border-[var(--color-border)] px-5 py-5">
                <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  先选方向
                </p>
                <h2
                  className="text-[1.25rem] font-medium leading-snug text-[var(--color-text-primary)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  你现在想看哪一种问题？
                </h2>
                <p className="text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
                  一个适合了解自己，一个适合观察具体事情。不用先懂八字或六爻，按你当下最想问的方向开始。
                </p>
              </header>

              <ol className="divide-y divide-[var(--color-border)]">
                {HERO_ENTRIES.map((entry, idx) => (
                  <li key={entry.id}>
                    <Link
                      href={entry.href}
                      className="group block px-5 py-5 transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:bg-[var(--color-bg-hover)] focus-visible:outline-none"
                    >
                      <div className="mb-3 grid grid-cols-[auto_1fr] items-baseline gap-4">
                      <span
                        className="font-mono text-[0.6875rem] text-[var(--color-text-hint)] tabular-nums"
                        aria-hidden="true"
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="text-[0.75rem] text-[var(--color-text-muted)]">
                          {entry.eyebrow}
                        </p>
                        <h3
                          className="text-[1.125rem] font-medium text-[var(--color-text-primary)]"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {entry.title}
                        </h3>
                      </div>
                      </div>
                      <div className="space-y-3 pl-0 md:pl-[2.2rem]">
                        <p className="text-[0.875rem] leading-[1.75] text-[var(--color-text-body)]">
                          {entry.desc}
                        </p>
                        <p className="text-[0.8125rem] leading-[1.7] text-[var(--color-text-secondary)]">
                          {entry.helper}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {entry.points.map((point) => (
                            <span
                              key={point}
                              className="border border-[var(--color-border)] px-2 py-1 text-[0.75rem] text-[var(--color-text-secondary)]"
                            >
                              {point}
                            </span>
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 pt-1 text-[0.875rem] font-medium text-[var(--color-primary)]">
                          {entry.cta}
                          <span
                            className="transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
              <footer className="border-t border-[var(--color-border)] px-5 py-4 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
                想了解“我是谁、我为什么总这样”，选八字。心里已经有一件明确的事，选六爻。
              </footer>
            </div>
          </aside>
        </div>
      </section>

      {/* ========== 价值定位 · 编辑型 ========== */}
      <section
        className="px-6 py-20 md:py-28"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <div className="mx-auto max-w-3xl space-y-12">
          <header className="space-y-3">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              为什么是东方文化
            </p>
            <h2
              className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              用另一套语言，重新理解自己。
            </h2>
            <p className="text-[1rem] md:text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
              不替你做决定，只帮你把性格、情绪和选择整理得更清楚。
            </p>
          </header>

          <ol className="space-y-8">
            {[
              {
                head: "看清你是谁",
                body: "八字文化分析会把出生信息转成一份结构化命盘，用白话解释你的性格倾向、优势和需要留意的地方。",
              },
              {
                head: "看懂你的情绪",
                body: "心镜灯让你持续记录感受。时间拉长后，你会更容易看见情绪变化和生活节奏之间的关系。",
              },
              {
                head: "看清下一步",
                body: "面对具体问题时，六爻文化参考会帮你拆开不同因素，补充一个整理思路的角度。",
              },
            ].map((item, idx) => (
              <li
                key={item.head}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-t border-[var(--color-border)] pt-6 first:border-t-0 first:pt-0"
              >
                <span
                  className="font-mono text-[0.75rem] tabular-nums text-[var(--color-text-hint)]"
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3
                  className="text-[1.125rem] md:text-[1.25rem] font-medium text-[var(--color-text-primary)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.head}
                </h3>
                <span aria-hidden="true" />
                <p className="text-[0.9375rem] md:text-[1rem] leading-[1.7] text-[var(--color-text-body)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========== 三大功能详细展示 ========== */}
      <div id="features-section">
        <FeatureShowcase />
      </div>

      {/* ========== 使用场景 ========== */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <header className="mb-12 space-y-3 md:mb-16 md:text-center">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              使用场景
            </p>
            <h2
              className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              他们都从一个真实问题开始，重新<span style={{ color: "var(--color-primary)" }}>看见自己</span>。
            </h2>
            <p className="text-[1rem] leading-relaxed text-[var(--color-text-secondary)]">三个日常场景，三种整理问题的方式。</p>
          </header>

          <div className="grid gap-6 md:grid-cols-3 md:gap-7">
            <article className="card flex flex-col gap-4 p-6">
              <blockquote
                className="text-[0.9375rem] leading-[1.8] text-[var(--color-text-body)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                「考虑跳槽那段时间，我一直拿不准方向。看完八字文化里的职业特质分析后，我多了一个整理自己优势和顾虑的角度。」
              </blockquote>
              <footer className="mt-auto space-y-2">
                <p className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">张女士</p>
                <p className="text-[0.75rem] text-[var(--color-text-muted)]">28 岁 · 产品经理 · 八字文化 / 心镜灯</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="border border-[var(--color-border)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-text-secondary)]">职业发展</span>
                  <span className="border border-[var(--color-border)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-text-secondary)]">自我认知</span>
                </div>
              </footer>
            </article>
            <article className="card flex flex-col gap-4 p-6">
              <blockquote
                className="text-[0.9375rem] leading-[1.8] text-[var(--color-text-body)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                「创业压力大的时候，焦虑经常混在每天的琐事里。用心镜灯记了一段时间后，我才看见自己在哪些节点更容易被压力推着走。」
              </blockquote>
              <footer className="mt-auto space-y-2">
                <p className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">李先生</p>
                <p className="text-[0.75rem] text-[var(--color-text-muted)]">35 岁 · 创业者 · 心镜灯</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="border border-[var(--color-border)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-text-secondary)]">情绪管理</span>
                  <span className="border border-[var(--color-border)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-text-secondary)]">压力释放</span>
                </div>
              </footer>
            </article>
            <article className="card flex flex-col gap-4 p-6">
              <blockquote
                className="text-[0.9375rem] leading-[1.8] text-[var(--color-text-body)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                「要不要接受外地的工作机会，我纠结了很久。六爻文化参考没有替我决定，但帮我把顾虑拆成几条可以比较的线。」
              </blockquote>
              <footer className="mt-auto space-y-2">
                <p className="text-[0.875rem] font-medium text-[var(--color-text-primary)]">王女士</p>
                <p className="text-[0.75rem] text-[var(--color-text-muted)]">32 岁 · 设计师 · 六爻文化 / 八字文化</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="border border-[var(--color-border)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-text-secondary)]">职业选择</span>
                  <span className="border border-[var(--color-border)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-text-secondary)]">理性决策</span>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </section>

      {/* ========== 为什么选择 · 编辑型 ========== */}
      <section
        className="px-6 py-20 md:py-28"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <div className="mx-auto max-w-3xl space-y-12">
          <header className="space-y-3">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              你可以放心
            </p>
            <h2
              className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              给你参考，不替你做决定。
            </h2>
          </header>

          <ol className="space-y-10">
            {[
              {
                head: "只给参考，不替你拍板",
                body: "AI 会整理传统文化内容和你的输入信息，但不会承诺结果，也不会代替你作出人生决定。",
              },
              {
                head: "术语有人帮你翻译",
                body: "遇到日主、十神、六亲这类概念时，页面会尽量用白话解释，方便初学者阅读。",
              },
              {
                head: "资料可管理，有保护措施",
                body: "出生信息、档案和历史记录有对应的管理入口。涉及个人资料的处理，会按隐私政策采取必要保护措施。",
              },
            ].map((item, idx) => (
              <li
                key={item.head}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-t border-[var(--color-border)] pt-8 first:border-t-0 first:pt-0"
              >
                <span
                  className="font-mono text-[0.75rem] tabular-nums text-[var(--color-text-hint)]"
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3
                  className="text-[1.125rem] md:text-[1.25rem] font-medium text-[var(--color-text-primary)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.head}
                </h3>
                <span aria-hidden="true" />
                <p className="text-[0.9375rem] md:text-[1rem] leading-[1.7] text-[var(--color-text-body)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========== 最终 CTA ========== */}
      <section
        className="px-6 py-20 md:py-28"
        style={{ background: "var(--color-bg-alt)" }}
      >
        <div className="mx-auto max-w-2xl space-y-10 md:text-center">
          <header className="space-y-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              开始
            </p>
            <h2
              className="text-[1.875rem] md:text-[2.25rem] lg:text-[2.5rem] leading-[1.2] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              先选一个方向，把问题说清楚。
            </h2>
            <p className="text-[1rem] md:text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
              想了解自己，先看八字；心里已经有一件明确的事，先问六爻。注册后可以保存结果，并获得 10 次八字解读和 10 次六爻参考额度。
            </p>
          </header>

          <ul className="space-y-3 text-left text-[0.9375rem] text-[var(--color-text-body)] md:mx-auto md:max-w-md">
            {[
              "八字：观察性格、关系、事业方向和长期节奏",
              "六爻：观察感情、工作、合作、选择等具体问题",
              "注册后 10 次八字解读 + 10 次六爻参考",
              "用白话解释结果，不需要先懂命理术语",
              "内容仅供自我观察和决策参考",
            ].map((item) => (
              <li key={item} className="grid grid-cols-[auto_1fr] items-baseline gap-3">
                <span
                  className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-[var(--color-primary)]"
                  aria-hidden="true"
                >
                  ·
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 md:justify-center">
            <PrimaryCta entry="final_cta">开始看我的八字</PrimaryCta>
            <SecondaryCta entry="final_cta" event="home_final_liuyao_cta_click" href="/liuyao" className="btn btn-secondary group">
              开始问一件事
            </SecondaryCta>
          </div>

          <p className="text-[0.75rem] text-[var(--color-text-hint)]">
            注册即表示同意
            <Link href="/terms" className="ml-1 underline-offset-2 hover:underline">用户协议</Link>
            <span className="mx-1">与</span>
            <Link href="/privacy" className="underline-offset-2 hover:underline">隐私政策</Link>
          </p>
          <p className="border-t border-[var(--color-border)] pt-5 text-[0.75rem] leading-6 text-[var(--color-text-muted)]">
            本平台内容由 AI 基于传统文化资料生成，仅供文化参考，不构成医疗、投资、法律或其他专业建议。
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
