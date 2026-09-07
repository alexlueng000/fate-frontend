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
    eyebrow: "想更了解自己",
    title: "最近总在想“我为什么会这样”？",
    desc: "从性格、关系和人生节奏开始，重新认识自己，也看见那些长期存在、却很少被认真说出来的倾向。",
    helper: "只需要准备出生日期、时间和地点。看不懂命理术语也没关系，我们会尽量用日常的话慢慢说明白。",
    points: ["性格倾向", "关系模式", "事业方向", "人生阶段", "长期节奏"],
    href: "/analysis/start",
    cta: "从了解自己开始",
  },
  {
    id: "liuyao",
    eyebrow: "心里放着一件事",
    title: "有件拿不准的事，想再看清一点？",
    desc: "把问题写下来，我们陪你看看其中的机会、阻力与变化，把混在一起的担心和现实条件一条条摊开。",
    helper: "不急着马上作决定。先围绕这件事看看现在处在什么位置，还有哪些容易忽略的线索。",
    points: ["感情关系", "工作机会", "合作推进", "选择判断", "近期进展"],
    href: "/liuyao",
    cta: "说说我正在纠结的事",
  },
] as const;

const TRUST_ITEMS = [
  {
    head: "先听懂你的问题",
    kicker: "认真回应，也保留分寸",
    body: "我们会结合传统文化和你说出的现实处境，把那些纠缠在一起的感受、选择与线索慢慢理清。能说明白的认真说明白，不确定的地方也会诚实保留。",
    note: "不催你接受某个答案，先陪你看见问题的全貌。",
  },
  {
    head: "不用先懂命理",
    kicker: "把难懂的话讲明白",
    body: "遇到日主、十神、六亲、动爻这类概念时，会优先解释它在现实语境里的含义。懂术语的人可以继续看结构，不懂的人也不必先去补课。",
    note: "你只需要带着自己的问题来，其余的交给我们解释。",
  },
  {
    head: "把一路的变化留下来",
    kicker: "值得回看的，不只是一份结果",
    body: "八字解读、六爻提问、心镜灯记录会尽量保持连续，让你能回看自己在不同阶段问过什么、在意什么、哪些问题反复出现。",
    note: "过一段时间再回头，也许会看见当时没有发现的自己。",
  },
  {
    head: "你的故事，由你保管",
    kicker: "隐私始终有边界",
    body: "出生信息、档案和历史记录都有对应管理入口。涉及个人资料的处理，会按隐私政策采取必要保护措施，并避免把敏感问题渲染成恐吓式结论。",
    note: "认真对待每一份信任，也不拿严肃的问题制造焦虑。",
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
              有些困惑，
              <br className="hidden md:block" />
              需要换个角度<span style={{ color: "var(--color-primary)" }}>慢慢看</span>。
            </h1>

            <p className="max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-body)] md:text-[1.0625rem]">
              想更了解自己，可以从八字看见性格、关系与人生节奏；正为一件事犹豫，也可以借六爻梳理当下的线索。不急着给答案，先把真正困扰你的地方看清楚。
            </p>

            <div className="inline-flex items-center gap-2 border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-3 py-2 text-[0.875rem] font-medium text-[var(--color-primary)]">
              <Gift className="h-4 w-4" aria-hidden="true" />
              第一次来？我们为你准备了 10 次八字解读和 10 次六爻参考
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <PrimaryCta entry="hero">从了解自己开始</PrimaryCta>
              <SecondaryCta entry="hero" event="home_liuyao_cta_click" href="/liuyao">
                我有一件事想问
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
                  此刻，你更想弄明白什么？
                </h2>
                <p className="text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
                  不需要先懂八字或六爻。跟着此刻最放不下、最想知道的那件事，选择一个入口就好。
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
                不必一次想明白所有事。先从此刻最在意的那一个问题开始。
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
        <div className="mx-auto max-w-5xl space-y-12 md:space-y-14">
          <header className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] md:items-end">
            <div className="space-y-4">
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                为什么是东方文化
              </p>
              <h2
                className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                用另一套语言，重新理解自己。
              </h2>
              <p className="max-w-2xl text-[1rem] md:text-[1.0625rem] leading-[1.8] text-[var(--color-text-secondary)]">
                有时候，我们不是没有答案，只是被焦虑、习惯和别人的期待遮住了。东方文化提供的是另一面镜子，让你从性格、关系与时间的变化里，再看自己一次。
              </p>
            </div>
            <div className="border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div>
                  <p className="font-serif text-[1.25rem] text-[var(--color-text-primary)]">长期</p>
                  <p className="mt-1 text-[0.75rem] text-[var(--color-text-muted)]">性格、关系、节奏</p>
                </div>
                <span className="h-10 w-px bg-[var(--color-border)]" aria-hidden="true" />
                <div>
                  <p className="font-serif text-[1.25rem] text-[var(--color-primary)]">当下</p>
                  <p className="mt-1 text-[0.75rem] text-[var(--color-text-muted)]">选择、阻力、变化</p>
                </div>
              </div>
            </div>
          </header>

          <ol className="grid gap-5 md:grid-cols-2">
            {[
              {
                head: "看见那个一直被忽略的自己",
                label: "八字文化",
                body: [
                  "为什么面对压力时，你总会用同一种方式回应？为什么有些关系让你格外在意？八字不会替你定义人生，但可以帮你看见那些长期存在、却很少被认真说出来的倾向。",
                  "你得到的不是一句定论，而是一份可以慢慢对照自己的观察：哪些是你的力量，哪些地方容易卡住，又该怎样用更适合自己的方式向前走。",
                ],
                meta: ["自我认知", "职业方向", "关系模式", "长期节奏"],
              },
              {
                head: "给眼前的犹豫一点空间",
                label: "六爻文化",
                body: [
                  "当一件事反复盘旋在心里，答案往往不是简单的“要”或“不要”。六爻更关注当下这一件具体的事，陪你看看现在的状态、可能的阻力与变化。",
                  "它不会替你选 A 或 B，但会把混在一起的担心、机会和现实条件一条条摊开，让你在做决定前，多一点从容，也多一个清醒的角度。",
                ],
                meta: ["感情关系", "工作机会", "合作推进", "近期选择"],
              },
            ].map((item, idx) => (
              <li
                key={item.head}
                className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 md:p-7 shadow-[var(--shadow-sm)]"
              >
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
                  <div>
                    <p className="text-[0.75rem] text-[var(--color-text-muted)]">{item.label}</p>
                    <h3
                      className="mt-2 text-[1.375rem] font-medium leading-snug text-[var(--color-text-primary)]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {item.head}
                    </h3>
                  </div>
                  <span
                    className="font-mono text-[0.75rem] tabular-nums text-[var(--color-text-hint)]"
                    aria-hidden="true"
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="space-y-4">
                  {item.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[0.9375rem] leading-[1.8] text-[var(--color-text-body)]"
                    >
                      {paragraph}
                    </p>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {item.meta.map((tag) => (
                      <span
                        key={tag}
                        className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-[0.75rem] text-[var(--color-text-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
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
        className="overflow-hidden px-6 py-20 md:py-28"
        style={{
          background:
            "linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg) 100%)",
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] lg:items-start">
          <header className="motion-reveal space-y-6 lg:sticky lg:top-24">
            <div className="space-y-3">
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                你可以放心
              </p>
              <h2
                className="max-w-xl text-[1.75rem] font-medium leading-[1.25] text-[var(--color-text-primary)] md:text-[2rem] lg:text-[2.25rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                我们会认真回应，也会诚实保留不确定。
              </h2>
            </div>
            <p className="max-w-xl text-[1rem] leading-[1.8] text-[var(--color-text-secondary)] md:text-[1.0625rem]">
              AI 帮你整理线索，传统文化提供观察角度。我们不会催你接受某个答案，只希望陪你把眼前的困惑看得更完整一些。
            </p>
            <div className="trust-statement motion-reveal delay-200 border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-5 shadow-[var(--shadow-sm)]">
              <p
                className="text-[1.125rem] leading-[1.65] text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                你仍然是那个做选择的人。
              </p>
              <p className="mt-3 text-[0.875rem] leading-[1.75] text-[var(--color-text-secondary)]">
                无论看到怎样的解读，真正了解自己的那个人，始终是你。
              </p>
            </div>
          </header>

          <ol className="grid gap-4 md:grid-cols-2">
            {TRUST_ITEMS.map((item, idx) => (
              <li
                key={item.head}
                className="motion-reveal trust-card group border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-sm)] md:p-6"
                style={{ animationDelay: `${120 + idx * 90}ms` }}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[0.75rem] text-[var(--color-text-muted)]">
                      {item.kicker}
                    </p>
                    <h3
                      className="text-[1.25rem] font-medium leading-snug text-[var(--color-text-primary)]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {item.head}
                    </h3>
                  </div>
                  <span
                    className="trust-index font-mono text-[0.75rem] tabular-nums text-[var(--color-text-hint)]"
                    aria-hidden="true"
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <span className="ink-rule mb-5 block h-px w-full bg-[var(--color-border)]" aria-hidden="true" />
                <p className="text-[0.9375rem] leading-[1.8] text-[var(--color-text-body)] md:text-[1rem]">
                  {item.body}
                </p>
                <p className="mt-5 border-t border-[var(--color-border-subtle)] pt-4 text-[0.8125rem] leading-[1.7] text-[var(--color-text-secondary)]">
                  {item.note}
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
              不必一次想明白所有事。
              <br />
              从此刻最在意的问题开始。
            </h2>
            <p className="text-[1rem] md:text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
              想重新认识自己，可以先看八字；心里正放着一件事，可以先问六爻。慢一点也没关系，我们陪你把它说清楚。
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
            <PrimaryCta entry="final_cta">从了解自己开始</PrimaryCta>
            <SecondaryCta entry="final_cta" event="home_final_liuyao_cta_click" href="/liuyao" className="btn btn-secondary group">
              说说我正在纠结的事
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
