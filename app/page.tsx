"use client";

import Link from "next/link";
import Footer from "@/app/components/Footer";
import FeatureShowcase from "@/app/components/landing/FeatureShowcase";
import ScenarioCard from "@/app/components/landing/ScenarioCard";
import { ArrowRight, ChevronRight } from "lucide-react";

const HERO_FEATURES = [
  {
    id: "bazi",
    name: "八字文化",
    tagline: "认识自我特质",
    desc: "基于出生信息生成传统文化分析内容，提供理解个人特质的参考视角。",
    color: "var(--color-feature-bazi)",
    anchor: "#feature-bazi",
  },
  {
    id: "xinji",
    name: "心镜灯",
    tagline: "看懂你的情绪",
    desc: "通过每日记录观察情绪变化，帮助整理个人感受与生活节奏。",
    color: "var(--color-feature-xinji)",
    anchor: "#feature-xinji",
  },
  {
    id: "liuyao",
    name: "六爻文化",
    tagline: "获得思考参考",
    desc: "提供传统文化卦象解析内容，为具体问题增加一个思考视角。",
    color: "var(--color-feature-liuyao)",
    anchor: "#feature-liuyao",
  },
] as const;

export default function LandingPage() {
  const scrollToFeatures = () => {
    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* ========== HERO ========== */}
      <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* 左：主文案 */}
          <div className="animate-fade-in space-y-7">
            <p className="text-[0.75rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              AI + 传统文化数字内容服务
            </p>

            <h1
              className="text-[1.75rem] leading-[1.25] font-medium md:text-[2.25rem] lg:text-[2.5rem]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-primary)",
              }}
            >
              从传统文化中，
              <br className="hidden md:block" />
              看见理解<span style={{ color: "var(--color-primary)" }}>自己</span>的新视角。
            </h1>

            <p className="max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-body)] md:text-[1.0625rem]">
              提供八字文化分析、情绪记录、六爻文化卦象解析与传统文化课程，让 AI 帮你整理信息、理解内容，并形成自己的判断。
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/demo" className="btn btn-primary group">
                查看示例报告
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="btn btn-ghost group"
              >
                了解三大功能
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>

            {/* 信任注脚 · 排版式而非图标堆 */}
            <p className="pt-2 text-[0.8125rem] text-[var(--color-text-muted)]">
              AI 生成内容 · 传统文化学习参考 ·
              <span className="ml-1">个人资料可管理和删除</span>
            </p>
          </div>

          {/* 右：三大功能列 · 静态、克制 */}
          <aside className="animate-fade-in delay-200">
            <div className="card overflow-hidden">
              <header className="flex items-baseline justify-between border-b border-[var(--color-border)] px-5 py-4">
                <h2
                  className="text-[1rem] font-medium"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
                >
                  三个工具，一站探索
                </h2>
                <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-hint)]">
                  Index
                </span>
              </header>

              <ol className="divide-y divide-[var(--color-border)]">
                {HERO_FEATURES.map((f, idx) => (
                  <li key={f.id}>
                    <Link
                      href={f.anchor}
                      onClick={(e) => {
                        e.preventDefault();
                        document.querySelector(f.anchor)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:bg-[var(--color-bg-hover)] focus-visible:outline-none"
                    >
                      <span
                        className="font-mono text-[0.6875rem] text-[var(--color-text-hint)] tabular-nums"
                        aria-hidden="true"
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-baseline gap-3">
                          <span
                            className="text-[1.0625rem] font-medium"
                            style={{ fontFamily: "var(--font-display)", color: f.color }}
                          >
                            {f.name}
                          </span>
                          <span className="text-[0.8125rem] text-[var(--color-text-secondary)]">
                            {f.tagline}
                          </span>
                        </div>
                        <p className="text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">
                          {f.desc}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-4 w-4 self-center text-[var(--color-text-hint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-text-secondary)]"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ol>

              <div className="border-t border-[var(--color-border)] px-5 py-4">
                <Link href="/register" className="btn btn-primary w-full group">
                  免费开始
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <p className="mt-3 text-center text-[0.6875rem] text-[var(--color-text-hint)]">
                  注册即表示同意 <Link href="/terms" className="underline-offset-2 hover:underline">用户协议</Link> 与 <Link href="/privacy" className="underline-offset-2 hover:underline">隐私政策</Link>
                </p>
              </div>
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
              产品定位
            </p>
            <h2
              className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              传统文化，是理解自己的另一种视角。
            </h2>
            <p className="text-[1rem] md:text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
              我们提供文化内容和信息整理工具，最终判断与选择始终由你自己完成。
            </p>
          </header>

          <ol className="space-y-8">
            {[
              {
                head: "理解自我特质",
                body: "通过八字文化分析，阅读关于个人特质、优势与注意事项的传统文化内容。",
              },
              {
                head: "看见内心情绪",
                body: "通过每日情绪记录整理感受与变化，逐步观察自己的生活节奏。",
              },
              {
                head: "辅助理性决策",
                body: "面对具体问题时，传统文化卦象解析提供补充视角，帮助你整理已有信息。",
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

      {/* ========== 使用场景 · 用户语录 ========== */}
      <section
        className="px-6 py-20 md:py-28"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <div className="mx-auto max-w-6xl">
          <header className="mb-12 space-y-3 md:mb-16 md:text-center">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              使用场景
            </p>
            <h2
              className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              他们都在用<span style={{ color: "var(--color-primary)" }}>认识自己</span>。
            </h2>
            <p className="text-[1rem] leading-relaxed text-[var(--color-text-secondary)]">真实场景，真实感受。</p>
          </header>

          <div className="grid gap-6 md:grid-cols-3 md:gap-7">
            <ScenarioCard
              persona="张女士"
              role="28 岁 · 产品经理"
              scenario="在考虑是否跳槽时，我阅读了八字文化中的职业特质分析。最终决定仍由自己完成，但多了一个整理想法的角度。"
              features={["八字文化", "心镜灯"]}
              tags={["职业发展", "自我认知"]}
            />
            <ScenarioCard
              persona="李先生"
              role="35 岁 · 创业者"
              scenario="创业压力大，经常焦虑。用心镜灯记录情绪后，我发现了自己的焦虑模式，也学会了更好地调节。现在每天睡前都会记录一下。"
              features={["心镜灯"]}
              tags={["情绪管理", "压力释放"]}
            />
            <ScenarioCard
              persona="王女士"
              role="32 岁 · 设计师"
              scenario="要不要接受外地的工作机会？我参考了六爻文化卦象解析，并把其中的提示和现实条件逐项比较，最后自己作出选择。"
              features={["六爻文化", "八字文化"]}
              tags={["职业选择", "理性决策"]}
            />
          </div>
        </div>
      </section>

      {/* ========== 为什么选择 · 编辑型 (取代 StatCard hero-metric) ========== */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl space-y-12">
          <header className="space-y-3">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              为什么选择
            </p>
            <h2
              className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] leading-[1.25] font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              清晰、克制的传统文化 AI 产品。
            </h2>
          </header>

          <ol className="space-y-10">
            {[
              {
                head: "提供参考，不替你下结论",
                body: "AI 负责生成和整理传统文化内容，不承诺结果，也不代替用户作出人生决定。",
              },
              {
                head: "专业且严谨",
                body: "结合传统文化资料与现代 AI，提供结构化内容和术语解释，方便初学者阅读与理解。",
              },
              {
                head: "隐私绝对保护",
                body: "采用必要的安全措施保护个人资料，并提供资料管理和删除入口。",
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

      {/* ========== 最终 CTA · 暖米白底 + 单点朱砂（取代 drenched primary） ========== */}
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
              准备好认识真实的自己了吗？
            </h2>
            <p className="text-[1rem] md:text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
              注册即可体验，会员套餐提供更多内容额度与课程观看权限。
            </p>
          </header>

          <ul className="space-y-3 text-left text-[0.9375rem] text-[var(--color-text-body)] md:mx-auto md:max-w-md">
            {[
              "八字文化分析 + AI 内容整理",
              "每日情绪追踪记录",
              "六爻文化卦象解析",
              "会员权益有效期 30 天",
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
            <Link href="/register" className="btn btn-primary group">
              免费开始
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="btn btn-secondary group">
              查看套餐定价
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <p className="text-[0.75rem] text-[var(--color-text-hint)]">
            注册即表示同意
            <Link href="/terms" className="ml-1 underline-offset-2 hover:underline">用户协议</Link>
            <span className="mx-1">与</span>
            <Link href="/privacy" className="underline-offset-2 hover:underline">隐私政策</Link>
          </p>
          <p className="border-t border-[var(--color-border)] pt-5 text-[0.75rem] leading-6 text-[var(--color-text-muted)]">
            本平台内容由 AI 基于传统文化资料生成，仅供文化研究、娱乐与个人参考，不构成医疗、投资、法律或其他专业建议。
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
