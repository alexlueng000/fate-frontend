'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Shield,
  Zap,
  Brain,
  ChevronRight,
  Star,
  Play,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [calendar, setCalendar] = useState<'gregorian' | 'lunar'>('gregorian');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartReading = () => {
    if (!birthDate || !birthTime) {
      alert('请填写出生日期和时间');
      return;
    }
    const params = new URLSearchParams({
      gender,
      calendar,
      birth_date: birthDate,
      birth_time: birthTime,
      birthplace: birthPlace.trim() || '北京',
    });
    router.push(`/try?${params.toString()}`);
  };

  return (
    <main className="min-h-screen relative">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* 背景：大面积渐变 + 装饰元素 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF0E8]" />

        {/* 装饰性圆环 */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] rounded-full border border-[var(--color-primary)]/10" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] rounded-full border border-[var(--color-gold)]/10" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[400px] h-[400px] rounded-full border border-[var(--color-primary)]/5" />

        {/* 浮动的八卦符号 */}
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
                AI 驱动的命理分析平台
              </div>

              {/* 主标题 */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="text-[var(--color-text-primary)]">在人生的</span>
                <br />
                <span className="text-gradient-primary">十字路口</span>
                <br />
                <span className="text-[var(--color-text-primary)]">多一个</span>
                <span className="text-[var(--color-gold)]">参考</span>
              </h1>

              {/* 副标题 */}
              <p className="text-xl text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
                结合传统八字命理与现代 AI 技术，为你提供<strong className="text-[var(--color-primary)]">科学、客观</strong>的命理分析，
                帮助你更好地认识自己。
              </p>

              {/* 特点标签 */}
              <div className="flex flex-wrap gap-4">
                {[
                  { label: '专业', icon: '🎓' },
                  { label: '严谨', icon: '📐' },
                  { label: '启发思考', icon: '💡' },
                ].map((tag) => (
                  <span
                    key={tag.label}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] text-base font-semibold shadow-md"
                  >
                    <span className="text-xl">{tag.icon}</span>
                    {tag.label}
                  </span>
                ))}
              </div>

              {/* 信任指标 */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
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
              <div className="pt-4">
                <Link
                  href="/demo"
                  className="btn btn-primary px-8 py-4 text-lg group"
                >
                  <Play className="w-5 h-5" />
                  查看示例报告
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 右侧：表单卡片 */}
            <div id="form-section" className={`${mounted ? 'animate-scale-in delay-200' : 'opacity-0'}`}>
              <div className="relative">
                {/* 卡片光晕 */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-gold)]/30 to-[var(--color-primary)]/20 rounded-[40px] blur-2xl opacity-60" />

                {/* 主卡片 */}
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-white/50">
                  {/* 卡片头部 */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                      开始你的命理之旅
                    </h2>
                    <p className="text-[var(--color-text-muted)] mt-2">填写出生信息，获取专属解读</p>
                  </div>

                  {/* 表单 */}
                  <div className="space-y-4">
                    {/* 性别选择 */}
                    <div className="grid grid-cols-2 gap-3">
                      {(['男', '女'] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`py-3.5 rounded-xl font-medium transition-all ${
                            gender === g
                              ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                              : 'bg-[var(--color-bg-deep)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                          }`}
                        >
                          {g === '男' ? '👨 男' : '👩 女'}
                        </button>
                      ))}
                    </div>

                    {/* 历法选择 */}
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'gregorian', label: '阳历' },
                        { value: 'lunar', label: '农历' },
                      ] as const).map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setCalendar(c.value)}
                          className={`py-3.5 rounded-xl font-medium transition-all ${
                            calendar === c.value
                              ? 'bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-white shadow-lg shadow-[var(--color-gold)]/25'
                              : 'bg-[var(--color-bg-deep)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* 日期输入 */}
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--color-bg-deep)] border-2 border-transparent focus:border-[var(--color-primary)] focus:bg-white outline-none transition-all"
                      />
                    </div>

                    {/* 时间输入 */}
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--color-bg-deep)] border-2 border-transparent focus:border-[var(--color-primary)] focus:bg-white outline-none transition-all"
                      />
                    </div>

                    {/* 地点输入 */}
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                      <input
                        type="text"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder="出生城市（如：北京）"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--color-bg-deep)] border-2 border-transparent focus:border-[var(--color-primary)] focus:bg-white outline-none transition-all placeholder:text-[var(--color-text-hint)]"
                      />
                    </div>

                    {/* 提交按钮 */}
                    <button
                      onClick={handleStartReading}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-lg font-semibold shadow-xl shadow-[var(--color-primary)]/30 hover:shadow-2xl hover:shadow-[var(--color-primary)]/40 hover:-translate-y-0.5 transition-all group"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        立即生成命理报告
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>

                    {/* 底部提示 */}
                    <p className="text-center text-xs text-[var(--color-text-hint)] pt-2">
                      🔒 数据加密存储，仅你可见 · 无需注册
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
        {/* 背景装饰 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)]/20 to-transparent" />

        <div className="max-w-6xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-[var(--color-text-primary)]">不是算命，是</span>
              <span className="text-gradient-primary">认识自己</span>
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              我们不预测命运，而是帮助你理解自己的特质与潜能
            </p>
          </div>

          {/* 三列卡片 */}
          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard
              icon="🎯"
              title="理解自我特质"
              description="通过八字分析，了解你的性格特点、天赋优势和潜在挑战，更好地认识真实的自己。"
              color="primary"
            />
            <ValueCard
              icon="🧭"
              title="把握时机节奏"
              description="分析大运流年，帮助你理解人生不同阶段的能量变化，在合适的时机做合适的事。"
              color="gold"
            />
            <ValueCard
              icon="💡"
              title="辅助理性决策"
              description="当逻辑分析无法给出答案时，传统智慧或许能为你提供另一个思考维度。"
              color="tech"
            />
          </div>
        </div>
      </section>

      {/* ========== 功能特点 SECTION ========== */}
      <section className="py-24 px-6 bg-gradient-to-b from-[var(--color-bg-deep)] to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左侧：特点列表 */}
            <div className="space-y-8">
              <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="text-[var(--color-text-primary)]">为什么选择</span>
                <br />
                <span className="text-gradient-gold">易凡文化</span>
              </h2>

              <div className="space-y-6">
                <FeatureItem
                  icon={<Zap className="w-6 h-6" />}
                  title="秒级响应"
                  description="AI 实时分析，无需等待，即刻获得专业解读"
                  color="primary"
                />
                <FeatureItem
                  icon={<Brain className="w-6 h-6" />}
                  title="深度解读"
                  description="结合传统命理与现代 AI，提供个性化深度分析"
                  color="gold"
                />
                <FeatureItem
                  icon={<Shield className="w-6 h-6" />}
                  title="隐私保护"
                  description="端到端加密，数据仅你可见，随时可删除"
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
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-[var(--color-text-primary)]">用户</span>
              <span className="text-gradient-primary">真实评价</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 text-[var(--color-gold)] fill-[var(--color-gold)]" />
                ))}
              </div>
              <span>基于 2,000+ 条真实评价</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              content="在考虑是否跳槽时用了一盏大师，它帮我理清了很多思路，看到了自己没注意到的优势。最终决定还是自己做的，但多了一份信心。"
              author="张女士"
              role="产品经理"
              rating={5}
            />
            <TestimonialCard
              content="作为理工科出身，本来持怀疑态度。但分析确实很有逻辑，不是模糊的套话，而是具体到我的情况。值得一试。"
              author="李先生"
              role="软件工程师"
              rating={5}
            />
            <TestimonialCard
              content="给我妈用了一下，她说比之前找的算命先生讲得还清楚，关键是随时可以问问题，不用担心被忽悠。"
              author="王同学"
              role="大学生"
              rating={4}
            />
          </div>
        </div>
      </section>

      {/* ========== 最终 CTA SECTION ========== */}
      <section className="py-24 px-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl text-white">☰</div>
          <div className="absolute bottom-10 right-10 text-9xl text-white">☷</div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            开启你的命理之旅
          </h2>
          <p className="text-xl text-white/80 mb-10">
            免费体验一次完整解读，感受传统智慧与现代科技的融合
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[var(--color-primary)] text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all group"
          >
            <Sparkles className="w-6 h-6" />
            立即免费体验
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

/* ========== 子组件 ========== */

function ValueCard({ icon, title, description, color }: {
  icon: string;
  title: string;
  description: string;
  color: 'primary' | 'gold' | 'tech';
}) {
  const colorMap = {
    primary: 'from-[var(--color-primary)] to-[var(--color-primary-light)]',
    gold: 'from-[var(--color-gold-dark)] to-[var(--color-gold)]',
    tech: 'from-[var(--color-tech)] to-[var(--color-tech-light)]',
  };

  return (
    <div className="group p-8 rounded-3xl bg-[var(--color-bg-deep)] hover:bg-white hover:shadow-2xl transition-all duration-300">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">{title}</h3>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureItem({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'gold' | 'tech';
}) {
  const colorMap = {
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    gold: 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]',
    tech: 'bg-[var(--color-tech)]/10 text-[var(--color-tech)]',
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
          // 计数动画
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
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

function TestimonialCard({ content, author, role, rating }: {
  content: string;
  author: string;
  role: string;
  rating: number;
}) {
  return (
    <div className="p-6 rounded-2xl bg-[var(--color-bg-deep)] hover:bg-white hover:shadow-xl transition-all">
      {/* 评分 */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-[var(--color-gold)] fill-[var(--color-gold)]' : 'text-gray-200'}`}
          />
        ))}
      </div>

      {/* 内容 */}
      <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">"{content}"</p>

      {/* 作者 */}
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
