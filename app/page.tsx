"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import { getAuthToken, checkProfileStatus } from "@/app/lib/auth";
import FeatureShowcase from "@/app/components/landing/FeatureShowcase";
import ScenarioCard from "@/app/components/landing/ScenarioCard";
import { ArrowRight, ChevronRight } from "lucide-react";

const HERO_FEATURES = [
  {
    id: "bazi",
    name: "八字",
    tagline: "看清你是谁",
    desc: "通过出生时间精准计算命盘，AI 深度解读性格特质与人生轨迹。",
    color: "var(--color-feature-bazi)",
    anchor: "#feature-bazi",
  },
  {
    id: "xinji",
    name: "心镜灯",
    tagline: "看懂你的情绪",
    desc: "每日情绪追踪，五行性格分析，发现你的情绪触发模式。",
    color: "var(--color-feature-xinji)",
    anchor: "#feature-xinji",
  },
  {
    id: "liuyao",
    name: "六爻",
    tagline: "看清下一步",
    desc: "一事一卦，AI 深度解读趋势与风险，辅助理性决策。",
    color: "var(--color-feature-liuyao)",
    anchor: "#feature-liuyao",
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        const status = await checkProfileStatus();
        if (status) {
          if (status.hasProfile) {
            router.replace("/panel");
          } else {
            router.replace("/profile/create");
          }
          return;
        }
      }
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  const scrollToFeatures = () => {
    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
  };

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="text-[var(--color-text-secondary)] text-sm">加载中…</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* ========== HERO ========== */}
      <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* 左：主文案 */}
          <div className="animate-fade-in space-y-7">
            <p className="text-[0.75rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              AI 驱动的自我认知
            </p>

            <h1
              className="text-[1.75rem] leading-[1.25] font-medium md:text-[2.25rem] lg:text-[2.5rem]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-primary)",
              }}
            >
              人生的答案不在别处，
              <br className="hidden md:block" />
              就在你<span style={{ color: "var(--color-primary)" }}>自己</span>身上。
            </h1>

            <p className="max-w-xl text-[1rem] leading-relaxed text-[var(--color-text-body)] md:text-[1.0625rem]">
              通过八字、情绪追踪、决策问卦，帮助你看清自己、理解情绪、把握时机。一面镜子，不是一个算命先生。
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
              已有 <span className="text-[var(--color-text-secondary)] tabular-nums">10,000+</span> 用户在使用 ·
              <span className="ml-1">数据端到端加密 ·</span>
              <span className="ml-1">随时可删除</span>
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
              不是算命，是认识自己。
            </h2>
            <p className="text-[1rem] md:text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
              我们不预测命运，而是帮助你理解自己的特质与潜能。
            </p>
          </header>

          <ol className="space-y-8">
            {[
              {
                head: "理解自我特质",
                body: "通过八字分析，了解你的性格特点、天赋优势和潜在挑战，更好地认识真实的自己。",
              },
              {
                head: "看见内心情绪",
                body: "每日情绪追踪与五行分析，帮助你发现情绪触发模式，从理解情绪开始改变自己。",
              },
              {
                head: "辅助理性决策",
                body: "当逻辑分析无法给出答案时，传统智慧为你提供另一个思考维度，多一份从容。",
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
              scenario="在考虑是否跳槽时，我用八字分析了自己的职业特质和当前大运。最终决定还是自己做的，但多了一份对自己的理解和信心。"
              features={["八字", "心镜灯"]}
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
              scenario="要不要接受外地的工作机会？逻辑分析了很久还是纠结。用六爻起了一卦，AI 的分析让我看到了一些没注意到的风险点，最终做了更理性的选择。"
              features={["六爻", "八字"]}
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
              不一样的命理产品。
            </h2>
          </header>

          <ol className="space-y-10">
            {[
              {
                head: "不是算命，是认识自己",
                body: "传统命理 + AI + 心理学。提供科学、理性、有温度的自我认知工具。我们不下定论，让你自己在被反射的过程里看清自己。",
              },
              {
                head: "专业且严谨",
                body: "结合传统命理与现代 AI，提供客观分析，不做模糊承诺。术语首次出现都有人话翻译——给小白看得懂，给爱好者看得深。",
              },
              {
                head: "隐私绝对保护",
                body: "端到端加密，数据仅你可见，随时可删除。零广告追踪，没有暗黑模式。",
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
              注册即可体验，套餐解锁更多次数。
            </p>
          </header>

          <ul className="space-y-3 text-left text-[0.9375rem] text-[var(--color-text-body)] md:mx-auto md:max-w-md">
            {[
              "完整八字命盘 + AI 解读",
              "每日情绪追踪记录",
              "六爻问事 · 一事一卦",
              "套餐次数永久有效",
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
        </div>
      </section>

      <Footer />
    </main>
  );
}
