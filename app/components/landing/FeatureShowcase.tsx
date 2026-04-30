'use client';

import { useEffect, useRef, useState } from 'react';
import FeatureCard from './FeatureCard';
import BaziPreview from './BaziPreview';
import EmotionChart from './EmotionChart';
import HexagramPreview from './HexagramPreview';

const FEATURES = [
  {
    id: 'feature-bazi',
    title: '你真的了解自己吗？',
    subtitle: '八字 · 看清你是谁',
    painPoints: [
      '为什么我总是在同样的地方摔跤？',
      '我的优势到底在哪里？',
      '为什么有些事我就是做不好？',
    ],
    solution: {
      intro: '通过出生时间的八字分析，AI 深度解读你的：',
      points: [
        '性格特质与天赋优势',
        '人生不同阶段的能量变化',
        '适合的发展方向与潜在挑战',
      ],
    },
    value: '不是预测命运，而是理解自己。让你在选择时多一份清晰。',
    visual: <BaziPreview />,
    ctaText: '查看完整示例',
    ctaLink: '/demo',
    themeColor: 'var(--color-primary)',
    themeBg: 'rgba(181,68,52,0.03)',
    reversed: false,
  },
  {
    id: 'feature-xinji',
    title: '情绪来了，你能看见它吗？',
    subtitle: '心镜灯 · 看懂你的情绪',
    painPoints: [
      '为什么我总是莫名烦躁？',
      '我的情绪模式是什么？',
      '如何更好地理解自己的感受？',
    ],
    solution: {
      intro: '每日情绪记录 + AI 对话分析：',
      points: [
        '追踪情绪变化趋势',
        '发现情绪触发模式',
        '基于五行理论的性格分析',
        '获得情绪调节建议',
      ],
    },
    value: '看见情绪，才能理解情绪。理解自己，才能改变自己。',
    visual: <EmotionChart />,
    ctaText: '开始情绪追踪',
    ctaLink: '/xinji',
    themeColor: 'var(--color-mist-deep)',
    themeBg: 'rgba(167,179,174,0.08)',
    reversed: true,
  },
  {
    id: 'feature-liuyao',
    title: '当逻辑无法给出答案时',
    subtitle: '六爻 · 看清下一步',
    painPoints: [
      '这个工作机会该不该接受？',
      '这段关系还要不要继续？',
      '这个决定的风险在哪里？',
    ],
    solution: {
      intro: '一事一卦，AI 深度解读：',
      points: [
        '分析事情的趋势与变化',
        '识别潜在的阻力与机会',
        '给出具体的行动建议',
        '帮助你做更理性的决策',
      ],
    },
    value: '不是替你决定，而是多一个视角。让你在选择时多一份从容。',
    visual: <HexagramPreview />,
    ctaText: '立即体验六爻',
    ctaLink: '/liuyao',
    themeColor: 'var(--color-gold-dark)',
    themeBg: 'rgba(176,138,87,0.06)',
    reversed: false,
  },
];

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {children}
    </div>
  );
}

export default function FeatureShowcase() {
  return (
    <section className="py-24 px-6 bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto space-y-24">
        {/* 标题 */}
        <AnimatedSection>
          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[var(--color-text-primary)]">三个工具，</span>
              <span className="text-gradient-primary">陪你认识自己</span>
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              从性格特质到情绪模式，从自我认知到决策支持
            </p>
          </div>
        </AnimatedSection>

        {/* 三大功能 */}
        {FEATURES.map((f, i) => (
          <AnimatedSection key={f.id} delay={i * 100}>
            <FeatureCard {...f} />
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
