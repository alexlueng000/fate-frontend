"use client";

import { useEffect } from "react";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import FeatureShowcase from "@/app/components/landing/FeatureShowcase";
import ScenarioCard from "@/app/components/landing/ScenarioCard";
import { useUser } from "@/app/lib/auth";
import { trackEvent } from "@/app/lib/analytics/track";
import { ArrowRight, ChevronRight, Gift } from "lucide-react";

const HERO_FEATURES = [
  {
    id: "bazi",
    name: "八字文化",
    tagline: "看清你是谁",
    desc: "输入出生信息，生成基础命盘和白话分析，作为理解性格倾向的参考。",
    color: "var(--color-feature-bazi)",
    anchor: "#feature-bazi",
  },
  {
    id: "xinji",
    name: "心镜灯",
    tagline: "看懂你的情绪",
    desc: "记录每日情绪，把感受和生活节奏放在一起观察。",
    color: "var(--color-feature-xinji)",
    anchor: "#feature-xinji",
  },
  {
    id: "liuyao",
    name: "六爻文化",
    tagline: "看清下一步",
    desc: "围绕一个具体问题，整理不同因素，提供补充视角。",
    color: "var(--color-feature-liuyao)",
    anchor: "#feature-liuyao",
  },
] as const;

export default function LandingPage() {
  const { user } = useUser();

  useEffect(() => {
    trackEvent("home_view", { payload: { entry: "landing" } });
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "var(--color-bg)" }}>
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
              看清<span style={{ color: "var(--color-primary)" }}>你自己</span>。
            </h1>

            <p className="max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-body)] md:text-[1.0625rem]">
              八字文化分析、情绪记录与六爻参考，帮你把性格、感受和选择整理得更清楚。
            </p>

            {!user && (
              <div className="inline-flex items-center gap-2 border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-3 py-2 text-[0.875rem] font-medium text-[var(--color-primary)]">
                <Gift className="h-4 w-4" aria-hidden="true" />
                新用户注册即享：八字解读 10 次 + 六爻参考 10 次
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={user ? "/dashboard" : "/analysis/start"}
                className="btn btn-primary group"
                onClick={() => trackEvent("home_primary_cta_click", {
                  payload: { entry: "hero", target: user ? "dashboard" : "guest_analysis_start" },
                })}
              >
                {user ? "进入命理首页" : "免费生成首次分析"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/demo"
                className="btn btn-ghost group"
                onClick={() => trackEvent("home_secondary_cta_click", { payload: { entry: "hero", target: "demo" } })}
              >
                查看示例报告
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
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
              <header className="flex items-baseline justify-between border-b border-[var(--color-border)] px-5 py-4">
                <h2
                  className="text-[1rem] font-medium"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
                >
                  三个工具，一个目标
                </h2>
                <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-text-hint)]">
                  Tools
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
              他们都从一个真实问题开始，重新<span style={{ color: "var(--color-primary)" }}>看见自己</span>。
            </h2>
            <p className="text-[1rem] leading-relaxed text-[var(--color-text-secondary)]">三个日常场景，三种整理问题的方式。</p>
          </header>

          <div className="grid gap-6 md:grid-cols-3 md:gap-7">
            <ScenarioCard
              persona="张女士"
              role="28 岁 · 产品经理"
              scenario="考虑跳槽那段时间，我一直拿不准方向。看完八字文化里的职业特质分析后，我多了一个整理自己优势和顾虑的角度。"
              features={["八字文化", "心镜灯"]}
              tags={["职业发展", "自我认知"]}
            />
            <ScenarioCard
              persona="李先生"
              role="35 岁 · 创业者"
              scenario="创业压力大的时候，焦虑经常混在每天的琐事里。用心镜灯记了一段时间后，我才看见自己在哪些节点更容易被压力推着走。"
              features={["心镜灯"]}
              tags={["情绪管理", "压力释放"]}
            />
            <ScenarioCard
              persona="王女士"
              role="32 岁 · 设计师"
              scenario="要不要接受外地的工作机会，我纠结了很久。六爻文化参考没有替我决定，但帮我把顾虑拆成几条可以比较的线。"
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
              先生成一份首次分析，再决定要不要继续聊。
            </h2>
            <p className="text-[1rem] md:text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
              首次分析不需要注册。注册后可以保存结果，并获得 10 次八字解读和 10 次六爻参考额度。
            </p>
          </header>

          <ul className="space-y-3 text-left text-[0.9375rem] text-[var(--color-text-body)] md:mx-auto md:max-w-md">
            {[
              "基础命盘和白话摘要",
              "注册后 10 次八字解读 + 10 次六爻参考",
              "心镜灯：持续记录情绪和生活节奏",
              "六爻文化：面对具体问题时的补充视角",
              "会员套餐可获得更多额度与课程权限",
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
            <Link
              href={user ? "/dashboard" : "/analysis/start"}
              className="btn btn-primary group"
              onClick={() => trackEvent("home_primary_cta_click", {
                payload: { entry: "final_cta", target: user ? "dashboard" : "guest_analysis_start" },
              })}
            >
              {user ? "进入命理首页" : "免费生成首次分析"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="btn btn-secondary group">
              查看会员套餐
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {!user && (
            <p className="text-[0.75rem] text-[var(--color-text-hint)]">
              注册即表示同意
              <Link href="/terms" className="ml-1 underline-offset-2 hover:underline">用户协议</Link>
              <span className="mx-1">与</span>
              <Link href="/privacy" className="underline-offset-2 hover:underline">隐私政策</Link>
            </p>
          )}
          <p className="border-t border-[var(--color-border)] pt-5 text-[0.75rem] leading-6 text-[var(--color-text-muted)]">
            本平台内容由 AI 基于传统文化资料生成，仅供文化参考，不构成医疗、投资、法律或其他专业建议。
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
