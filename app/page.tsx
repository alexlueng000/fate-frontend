'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import { getAuthToken, checkProfileStatus } from '@/app/lib/auth';
import FeatureShowcase from '@/app/components/landing/FeatureShowcase';
import ScenarioCard from '@/app/components/landing/ScenarioCard';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Brain,
  Star,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

// ---- Hero 右侧功能轮播数据 ----
const HERO_FEATURES = [
  {
    id: 'bazi',
    icon: '☰',
    name: '八字',
    tagline: '看清你是谁',
    desc: '通过出生时间精准计算命盘，AI 深度解读性格特质与人生轨迹',
    color: 'var(--color-primary)',
    bg: 'rgba(181,68,52,0.06)',
    anchor: '#feature-bazi',
  },
  {
    id: 'xinji',
    icon: '🪷',
    name: '心镜灯',
    tagline: '看懂你的情绪',
    desc: '每日情绪追踪，五行性格分析，发现你的情绪触发模式',
    color: 'var(--color-mist-deep)',
    bg: 'rgba(167,179,174,0.08)',
    anchor: '#feature-xinji',
  },
  {
    id: 'liuyao',
    icon: '⚊',
    name: '六爻',
    tagline: '看清下一步',
    desc: '一事一卦，AI 深度解读趋势与风险，辅助理性决策',
    color: 'var(--color-gold-dark)',
    bg: 'rgba(176,138,87,0.08)',
    anchor: '#feature-liuyao',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [heroFeatureIdx, setHeroFeatureIdx] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        const status = await checkProfileStatus();
        if (status) {
          if (status.hasProfile) {
            router.replace('/panel');
          } else {
            router.replace('/profile/create');
          }
          return;
        }
      }
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 自动轮播 Hero 功能卡片
  useEffect(() => {
    const t = setInterval(() => setHeroFeatureIdx((i) => (i + 1) % HERO_FEATURES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <div className="text-neutral-600">加载中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F3EE] via-[#FBF8F4] to-[#F1EAE2]" />

        {/* 装饰性圆环 */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] rounded-full border border-[var(--color-primary)]/10" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] rounded-full border border-[var(--color-gold)]/10" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[400px] h-[400px] rounded-full border border-[var(--color-primary)]/5" />

        {/* 浮动八卦符号 */}
        <div className="absolute top-20 right-20 text-8xl text-[var(--color-gold)]/10 animate-float">☰</div>
        <div className="absolute bottom-32 right-40 text-6xl text-[var(--color-primary)]/10 animate-float delay-300">☵</div>
        <div className="absolute top-40 left-20 text-5xl text-[var(--color-gold)]/10 animate-float delay-500">☲</div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左侧：文案 */}
            <div className={`space-y-8 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              {/* 标签 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI 驱动的自我认知平台
              </div>

              {/* 主标题 */}
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="text-[var(--color-text-primary)]">人生的答案</span>
                <br />
                <span className="text-gradient-primary">不在别处</span>
                <br />
                <span className="text-[var(--color-text-primary)]">就在你</span>
                <span className="text-[var(--color-gold)]">自己</span>
                <span className="text-[var(--color-text-primary)]">身上</span>
              </h1>

              {/* 副标题 */}
              <p className="text-xl text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
                通过
                <strong className="text-[var(--color-primary)]">八字分析</strong>、
                <strong className="text-[var(--color-mist-deep)]">情绪追踪</strong>、
                <strong className="text-[var(--color-gold-dark)]">决策问卦</strong>，
                帮助你看清自己、理解情绪、把握时机
              </p>

              {/* 信任指标 */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-[var(--color-gold)] fill-[var(--color-gold)]" />
                    ))}
                  </div>
                  <span>4.9 分好评</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>10,000+ 用户信赖</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>数据加密保护</span>
                </div>
              </div>

              {/* CTA 按钮 */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/demo" className="btn btn-primary px-8 py-4 text-lg group rounded-md">
                  <Sparkles className="w-5 h-5" />
                  查看示例报告
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={scrollToFeatures}
                  className="btn btn-secondary px-8 py-4 text-lg group rounded-md"
                >
                  3 分钟了解三大功能
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* 右侧：功能轮播 */}
            <div className={`${mounted ? 'animate-scale-in delay-200' : 'opacity-0'}`}>
              <div className="relative">
                {/* 卡片光晕 */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-gold)]/30 to-[var(--color-primary)]/20 rounded-[40px] blur-2xl opacity-60" />

                {/* 主卡片 */}
                <div className="relative bg-[var(--color-bg-elevated)] rounded-lg p-8 shadow-md border border-[var(--color-border)]">
                  <div className="text-center mb-6">
                    <h2
                      className="text-2xl font-bold text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      三大功能，一站探索
                    </h2>
                    <p className="text-[var(--color-text-muted)] mt-2 text-sm">选择你感兴趣的方向</p>
                  </div>

                  {/* 功能卡片列表 */}
                  <div className="space-y-3">
                    {HERO_FEATURES.map((f, i) => (
                      <a
                        key={f.id}
                        href={f.anchor}
                        onClick={(e) => {
                          e.preventDefault();
                          setHeroFeatureIdx(i);
                          document.querySelector(f.anchor)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="block rounded-xl p-4 border transition-all duration-300 cursor-pointer"
                        style={{
                          background: heroFeatureIdx === i ? f.bg : 'var(--color-bg-deep)',
                          borderColor: heroFeatureIdx === i ? `${f.color}40` : 'var(--color-border)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0"
                            style={{
                              background: heroFeatureIdx === i ? f.bg : 'transparent',
                              color: f.color,
                            }}
                          >
                            {f.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-semibold text-sm"
                                style={{ color: heroFeatureIdx === i ? f.color : 'var(--color-text-primary)' }}
                              >
                                {f.name}
                              </span>
                              <span className="text-xs text-[var(--color-text-muted)]">{f.tagline}</span>
                            </div>
                            {heroFeatureIdx === i && (
                              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                                {f.desc}
                              </p>
                            )}
                          </div>
                          <ArrowRight
                            className="w-4 h-4 flex-shrink-0 transition-all"
                            style={{ color: heroFeatureIdx === i ? f.color : 'var(--color-text-hint)' }}
                          />
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* 底部 CTA */}
                  <div className="mt-6 space-y-3">
                    <Link
                      href="/register"
                      className="w-full py-3.5 rounded-md bg-[var(--color-primary)] text-[#FFF8F2] text-base font-semibold shadow-md hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                    >
                      <Sparkles className="w-5 h-5" />
                      免费开始
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <p className="text-center text-xs text-[var(--color-text-hint)]">
                      🔒 注册即表示同意《用户协议》和《隐私政策》
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 核心价值 SECTION ========== */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)]/20 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[var(--color-text-primary)]">不是算命，是</span>
              <span className="text-gradient-primary">认识自己</span>
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              我们不预测命运，而是帮助你理解自己的特质与潜能
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard
              icon="🎯"
              title="理解自我特质"
              description="通过八字分析，了解你的性格特点、天赋优势和潜在挑战，更好地认识真实的自己。"
              color="primary"
            />
            <ValueCard
              icon="🪷"
              title="看见内心情绪"
              description="每日情绪追踪与五行分析，帮助你发现情绪触发模式，从理解情绪开始改变自己。"
              color="mist"
            />
            <ValueCard
              icon="🧭"
              title="辅助理性决策"
              description="当逻辑分析无法给出答案时，传统智慧为你提供另一个思考维度，多一份从容。"
              color="gold"
            />
          </div>
        </div>
      </section>

      {/* ========== 三大功能展示 SECTION ========== */}
      <div id="features-section">
        <FeatureShowcase />
      </div>

      {/* ========== 使用场景 SECTION ========== */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[var(--color-text-primary)]">他们都在用易凡文化</span>
              <span className="text-gradient-primary">认识自己</span>
            </h2>
            <p className="text-[var(--color-text-secondary)]">真实场景，真实感受</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ScenarioCard
              persona="张女士，28岁"
              role="产品经理"
              scenario="在考虑是否跳槽时，我用八字分析了自己的职业特质和当前大运。虽然最终决定还是自己做的，但多了一份对自己的理解和信心。"
              features={['八字', '心镜灯']}
              tags={['#职业发展', '#自我认知']}
              accentColor="var(--color-primary)"
            />
            <ScenarioCard
              persona="李先生，35岁"
              role="创业者"
              scenario="创业压力大，经常焦虑。用心镜灯记录情绪后，我发现自己的焦虑模式，也学会了更好地调节。现在每天睡前都会记录一下。"
              features={['心镜灯']}
              tags={['#情绪管理', '#压力释放']}
              accentColor="var(--color-mist-deep)"
            />
            <ScenarioCard
              persona="王女士，32岁"
              role="设计师"
              scenario="要不要接受外地的工作机会？逻辑分析了很久还是纠结。用六爻起了一卦，AI 的分析让我看到了一些没注意到的风险点，最终做了更理性的选择。"
              features={['六爻', '八字']}
              tags={['#职业选择', '#理性决策']}
              accentColor="var(--color-gold-dark)"
            />
          </div>
        </div>
      </section>

      {/* ========== 为什么选择易凡文化 SECTION ========== */}
      <section className="py-24 px-6 bg-gradient-to-b from-[var(--color-bg-deep)] to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左侧：信任点 */}
            <div className="space-y-8">
              <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="text-[var(--color-text-primary)]">为什么选择</span>
                <br />
                <span className="text-gradient-gold">易凡文化</span>
              </h2>

              <div className="space-y-6">
                <FeatureItem
                  icon={<Brain className="w-6 h-6" />}
                  title="不是算命，是认识自己"
                  description="传统命理 + AI + 心理学，提供科学、理性、有温度的自我认知工具"
                  color="primary"
                />
                <FeatureItem
                  icon={<Zap className="w-6 h-6" />}
                  title="专业且严谨"
                  description="结合传统命理与现代 AI，提供客观分析，不做模糊承诺"
                  color="gold"
                />
                <FeatureItem
                  icon={<Shield className="w-6 h-6" />}
                  title="隐私绝对保护"
                  description="端到端加密，数据仅你可见，随时可删除，零广告追踪"
                  color="tech"
                />
              </div>
            </div>

            {/* 右侧：统计数据 */}
            <div className="grid grid-cols-2 gap-6">
              <StatCard number={10000} suffix="+" label="累计用户" />
              <StatCard number={98} suffix="%" label="满意度" />
              <StatCard number={3} suffix="分钟" label="平均响应" />
              <StatCard number={24} suffix="/7" label="全天服务" />
            </div>
          </div>
        </div>
      </section>

      {/* ========== 用户评价 SECTION ========== */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[var(--color-text-primary)]">用户</span>
              <span className="text-gradient-primary">真实评价</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-[var(--color-gold)] fill-[var(--color-gold)]" />
                ))}
              </div>
              <span>基于 2,000+ 条真实评价</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              content="作为程序员，本来对这类东西持怀疑态度。但八字分析确实很有逻辑，不是模糊的套话，而是具体到我的情况。心镜灯的情绪追踪也很实用，帮我发现了自己的压力模式。"
              author="李先生"
              role="软件工程师"
              rating={5}
            />
            <TestimonialCard
              content="在考虑是否跳槽时用了易凡文化，八字分析让我看到了自己的优势和当前阶段的能量状态。最终决定还是自己做的，但多了一份信心和清晰。"
              author="张女士"
              role="产品经理"
              rating={5}
            />
            <TestimonialCard
              content="给我妈用了一下，她说比之前找的算命先生讲得还清楚。关键是随时可以问问题，不用担心被忽悠。现在她每天都用心镜灯记录情绪。"
              author="王同学"
              role="大学生"
              rating={4}
            />
          </div>
        </div>
      </section>

      {/* ========== 最终 CTA SECTION ========== */}
      <section className="py-24 px-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl text-white">☰</div>
          <div className="absolute bottom-10 right-10 text-9xl text-white">☷</div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            准备好认识真实的自己了吗？
          </h2>
          <p className="text-xl text-white/80 mb-4">免费注册，立即开始你的自我探索之旅</p>
          <ul className="inline-flex flex-col items-start gap-2 mb-10 text-white/90 text-sm">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-white/70" />完整八字分析报告</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-white/70" />每日情绪追踪记录</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-white/70" />3 次免费六爻问事</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-white/70" />AI 深度解读对话</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[var(--color-primary)] text-xl font-bold rounded-2xl shadow-2xl hover:-translate-y-1 transition-all group"
            >
              <Sparkles className="w-6 h-6" />
              免费开始
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white/10 text-white text-xl font-bold rounded-2xl border border-white/30 hover:bg-white/20 transition-all"
            >
              已有账号？立即登录
            </Link>
          </div>
          <p className="mt-6 text-white/50 text-xs">
            🔒 注册即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ========== 子组件 ========== */

function ValueCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: 'primary' | 'gold' | 'mist';
}) {
  const colorMap = {
    primary: { bg: 'from-[var(--color-primary)] to-[var(--color-primary-hover)]', text: 'var(--color-primary)' },
    gold: { bg: 'from-[var(--color-gold-dark)] to-[var(--color-gold)]', text: 'var(--color-gold-dark)' },
    mist: { bg: 'from-[var(--color-mist-deep)] to-[var(--color-mist)]', text: 'var(--color-mist-deep)' },
  };

  return (
    <div className="group p-8 rounded-3xl bg-[var(--color-bg-deep)] hover:bg-white hover:shadow-2xl transition-all duration-300">
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMap[color].bg} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">{title}</h3>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'gold' | 'tech';
}) {
  const colorMap = {
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    gold: 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]',
    tech: 'bg-[var(--color-mist-light)] text-[var(--color-mist-deep)]',
  };

  return (
    <div className="flex gap-4">
      <div className={`w-12 h-12 rounded-xl ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
        <p className="text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, suffix, label }: { number: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(number * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [number, hasAnimated]);

  return (
    <div ref={ref} className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow text-center">
      <div className="text-4xl font-bold text-gradient-primary mb-2">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

function TestimonialCard({
  content,
  author,
  role,
  rating,
}: {
  content: string;
  author: string;
  role: string;
  rating: number;
}) {
  return (
    <div className="p-6 rounded-2xl bg-[var(--color-bg-deep)] hover:bg-white hover:shadow-xl transition-all">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-[var(--color-gold)] fill-[var(--color-gold)]' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center text-white font-medium">
          {author[0]}
        </div>
        <div>
          <div className="font-medium text-[var(--color-text-primary)]">{author}</div>
          <div className="text-sm text-[var(--color-text-muted)]">{role}</div>
        </div>
      </div>
    </div>
  );
}
