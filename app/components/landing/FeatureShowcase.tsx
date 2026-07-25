"use client";

import { useEffect, useRef, useState } from "react";
import FeatureCard from "./FeatureCard";
import BaziPreview from "./BaziPreview";
import EmotionChart from "./EmotionChart";
import HexagramPreview from "./HexagramPreview";

const FEATURES = [
  {
    id: "feature-bazi",
    title: "你真的了解自己吗？",
    subtitle: "八字文化 · 认识自我特质",
    painPoints: [
      "为什么我总是在同样的地方摔跤？",
      "我的优势到底在哪里？",
      "为什么有些事我就是做不好？",
    ],
    solution: {
      intro: "基于出生信息生成八字文化分析内容，包括：",
      points: [
        "传统文化中的性格特质描述",
        "不同人生阶段的文化解读",
        "个人优势与注意事项参考",
      ],
    },
    value: "提供传统文化视角，帮助你整理信息；最终判断由你自己完成。",
    visual: <BaziPreview />,
    ctaText: "查看完整示例",
    ctaLink: "/demo",
    themeColor: "var(--color-feature-bazi)",
    reversed: false,
  },
  {
    id: "feature-xinji",
    title: "情绪来了，你能看见它吗？",
    subtitle: "心镜灯 · 看懂你的情绪",
    painPoints: [
      "为什么我总是莫名烦躁？",
      "我的情绪模式是什么？",
      "如何更好地理解自己的感受？",
    ],
    solution: {
      intro: "每日情绪记录 + AI 对话分析：",
      points: [
        "追踪情绪变化趋势",
        "发现情绪触发模式",
        "基于五行理论的性格分析",
        "整理可尝试的日常行动",
      ],
    },
    value: "看见情绪，才能理解情绪。理解自己，才能改变自己。",
    visual: <EmotionChart />,
    ctaText: "开始情绪追踪",
    ctaLink: "/xinji",
    themeColor: "var(--color-feature-xinji)",
    reversed: true,
  },
  {
    id: "feature-liuyao",
    title: "当逻辑无法给出答案时",
    subtitle: "六爻文化 · 获得思考参考",
    painPoints: [
      "这个工作机会该不该接受？",
      "这段关系还要不要继续？",
      "这个决定的风险在哪里？",
    ],
    solution: {
      intro: "围绕一个具体问题生成卦象文化解析：",
      points: [
        "解释卦象结构与传统含义",
        "整理问题中的不同因素",
        "提供可供比较的思考角度",
        "提醒结合现实信息自行判断",
      ],
    },
    value: "不是替你决定，而是多一个视角。让你在选择时多一份从容。",
    visual: <HexagramPreview />,
    ctaText: "体验卦象解析",
    ctaLink: "/liuyao",
    themeColor: "var(--color-feature-liuyao)",
    reversed: false,
  },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => setVisible(true), delay);
          observer.disconnect();
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, reduced]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: reduced
          ? "none"
          : "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}

export default function FeatureShowcase() {
  return (
    <section
      className="px-6 py-20 md:py-28"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="mx-auto max-w-5xl space-y-20 md:space-y-28">
        {/* 标题 */}
        <AnimatedSection>
          <header className="space-y-3 text-center">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              三个工具，一种方法
            </p>
            <h2
              className="text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] font-medium leading-[1.25] text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              三个工具，陪你认识自己
            </h2>
            <p className="mx-auto max-w-xl text-[1rem] md:text-[1.0625rem] text-[var(--color-text-secondary)] leading-relaxed">
              从性格特质到情绪模式，从自我认知到决策支持。
            </p>
          </header>
        </AnimatedSection>

        {FEATURES.map((f, i) => (
          <AnimatedSection key={f.id} delay={i * 80}>
            <FeatureCard {...f} />
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
