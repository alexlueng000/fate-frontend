'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Shield,
  Zap,
  Brain,
  MapPin,
} from 'lucide-react';
import Image from 'next/image';

// 八卦符号
const BAGUA = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

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
    if (!birthDate || !birthTime || !birthPlace) {
      alert('请填写完整的出生信息：日期、时间和地点');
      return;
    }
    const params = new URLSearchParams({
      gender,
      calendar,
      birth_date: birthDate,
      birth_time: birthTime,
      birthplace: birthPlace,
    });
    router.push(`/try?${params.toString()}`);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Soft gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)] rounded-full opacity-5 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-gold)] rounded-full opacity-5 blur-[80px] animate-pulse-glow delay-500" />

        {/* Rotating Bagua Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.05] animate-rotate-slow">
          {BAGUA.map((symbol, i) => (
            <span
              key={i}
              className="absolute text-6xl text-[var(--color-primary)]"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 45}deg) translateY(-350px) rotate(-${i * 45}deg)`,
              }}
            >
              {symbol}
            </span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center w-full">
          {/* Social Proof Badge */}
          <div
            className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass mb-8 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
          >
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center text-white text-xs font-medium border-2 border-white">张</div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-tech)] flex items-center justify-center text-white text-xs font-medium border-2 border-white">李</div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-tech)] to-[var(--color-primary)] flex items-center justify-center text-white text-xs font-medium border-2 border-white">王</div>
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">
              <span className="text-[var(--color-primary)] font-semibold">10,000+</span> 用户已获得解读
            </span>
          </div>

          {/* Main Title */}
          <h1
            className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 opacity-0 ${mounted ? 'animate-slide-up delay-100' : ''}`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-gradient-primary">解读命理智慧</span>
            <br />
            <span className="text-[var(--color-text-primary)]">洞察人生趋势</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-base md:text-lg lg:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 px-2 opacity-0 ${mounted ? 'animate-fade-in delay-200' : ''}`}
          >
            基于传统八字理论与现代概率模型，为你提供
            <span className="text-[var(--color-primary)]">科学、客观</span>
            的命理分析与趋势预测
          </p>

          {/* Quick Try Form */}
          <div
            className={`max-w-xl mx-auto w-full card p-6 sm:p-8 opacity-0 ${mounted ? 'animate-scale-in delay-300' : ''}`}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-text-muted)]">免费体验一次完整解读</span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Gender Selection */}
              <div className="flex gap-3">
                <button
                  onClick={() => setGender('男')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base ${
                    gender === '男'
                      ? 'bg-[var(--color-bg-hover)] border border-[var(--color-gold-dark)] text-[var(--color-gold)]'
                      : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-accent)]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>男</span>
                </button>
                <button
                  onClick={() => setGender('女')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base ${
                    gender === '女'
                      ? 'bg-[var(--color-bg-hover)] border border-[var(--color-gold-dark)] text-[var(--color-gold)]'
                      : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-accent)]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>女</span>
                </button>
              </div>

              {/* Calendar Selection */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCalendar('gregorian')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base ${
                    calendar === 'gregorian'
                      ? 'bg-[var(--color-bg-hover)] border border-[var(--color-gold-dark)] text-[var(--color-gold)]'
                      : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-accent)]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>阳历</span>
                </button>
                <button
                  onClick={() => setCalendar('lunar')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base ${
                    calendar === 'lunar'
                      ? 'bg-[var(--color-bg-hover)] border border-[var(--color-gold-dark)] text-[var(--color-gold)]'
                      : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-accent)]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>农历</span>
                </button>
              </div>

              {/* Birth Date */}
              <div className="relative">
                <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="input !pl-10 sm:!pl-12"
                  placeholder="出生日期"
                />
              </div>

              {/* Birth Time */}
              <div className="relative">
                <Clock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="input !pl-10 sm:!pl-12"
                  placeholder="出生时间"
                />
              </div>

              {/* Birth Place - 必填 */}
              <div className="relative">
                <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="input !pl-10 sm:!pl-12"
                  placeholder="出生地点（必填）"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleStartReading}
                className="w-full btn btn-primary py-3 sm:py-4 text-base sm:text-lg font-semibold group"
              >
                <Sparkles className="w-5 h-5" />
                立即免费解读
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-hint)] mt-4 text-center px-2">
              无需注册，立即体验 · 数据加密存储
            </p>
          </div>

          {/* Trust Indicators */}
          <div className={`flex items-center justify-center gap-6 mt-8 text-[var(--color-text-hint)] text-sm opacity-0 ${mounted ? 'animate-fade-in delay-400' : ''}`}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>数据加密</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>秒级响应</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI 深度解读</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <ChevronDown className="w-6 h-6 text-[var(--color-text-hint)]" />
        </div>
      </section>

      {/* Stats Bar Section */}
      <section className="relative z-10 py-12 px-4 bg-gradient-to-r from-[var(--color-primary)]/5 via-[var(--color-gold)]/5 to-[var(--color-primary)]/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem number="10,000+" label="累计解读" />
            <StatItem number="98%" label="用户满意度" />
            <StatItem number="3分钟" label="平均响应" />
            <StatItem number="24/7" label="全天候服务" />
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="relative z-10 py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="mb-12">
            <h2
              className="text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[var(--color-text-primary)]">在</span>
              <span className="text-gradient-primary"> 50/50 </span>
              <span className="text-[var(--color-text-primary)]">的决策中</span>
              <br />
              <span className="text-gradient-gold">增加一点可能性</span>
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              人生充满选择，当理性分析无法给出答案时，
              传统智慧或许能为你提供另一个视角
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <VisionCard
              icon="🎯"
              title="不是预测命运"
              description="而是理解自己的能量特质与潜在优势"
            />
            <VisionCard
              icon="🧭"
              title="不是迷信依赖"
              description="而是在迷茫时获得一个参考方向"
            />
            <VisionCard
              icon="💡"
              title="不是绝对答案"
              description="而是为决策增加一个思考维度"
            />
          </div>
        </div>
      </section>

      {/* Dual Positioning Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[var(--color-text-primary)]">双重定位</span>
              <span className="text-[var(--color-gold)]">·</span>
              <span className="text-[var(--color-text-primary)]">科学解读</span>
            </h2>
            <div className="ornament-line w-24 mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Knowledge Interpreter */}
            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-gold-dark)] to-[var(--color-gold)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-[var(--color-bg-deep)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-gold)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                传统文化知识的解释者
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                深入浅出地解读八字命理、五行生克、大运流年等传统智慧，
                让古老的东方哲学变得通俗易懂。
              </p>
              <ul className="space-y-3">
                {['八字基础知识科普', '五行相生相克原理', '术语通俗化解读', '文化背景深度讲解'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--color-text-muted)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Trend Analysis Tool */}
            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-primary-light)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                基于概率模型的趋势分析
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                运用现代数据分析方法，将传统命理转化为可量化的趋势预测，
                提供客观、科学的参考依据。
              </p>
              <ul className="space-y-3">
                {['大运流年趋势图表', '五行能量分布分析', '关键时间节点预测', '多维度数据可视化'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--color-text-muted)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              为什么选择易凡
            </h2>
            <div className="ornament-line w-24 mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="秒级响应"
              description="AI 实时分析，无需等待，即刻获得专业解读"
              gradient="from-[var(--color-primary-dark)] to-[var(--color-primary)]"
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="智能解读"
              description="结合传统理论与现代 AI，提供深度个性化分析"
              gradient="from-[var(--color-gold-dark)] to-[var(--color-gold)]"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="隐私安全"
              description="端到端加密，数据仅你可见，随时可删除"
              gradient="from-[var(--color-tech)] to-[var(--color-tech-light)]"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-24 px-4 bg-[var(--color-bg-deep)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              用户真实反馈
            </h2>
            <div className="ornament-line w-24 mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              content="在考虑是否跳槽时用了一盏大师，虽然最终决定还是自己做的，但它帮我理清了很多思路，看到了自己没注意到的优势。"
              author="张女士"
              role="互联网产品经理"
              avatar="张"
            />
            <TestimonialCard
              content="作为一个理工科出身的人，本来对这类东西持怀疑态度。但它的分析确实很有逻辑，不是那种模糊的套话，而是具体到我的情况。"
              author="李先生"
              role="软件工程师"
              avatar="李"
            />
            <TestimonialCard
              content="给我妈用了一下，她说比她之前找的算命先生讲得还清楚，关键是随时可以问问题，不用担心被忽悠。"
              author="王同学"
              role="大学生"
              avatar="王"
            />
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              三步获取专属解读
            </h2>
            <div className="ornament-line w-24 mx-auto mt-4" />
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold-dark)] to-transparent -translate-y-1/2" />

            <div className="grid md:grid-cols-3 gap-8">
              <ProcessStep
                number="01"
                title="输入信息"
                description="填写出生日期和时间"
              />
              <ProcessStep
                number="02"
                title="AI 分析"
                description="智能生成命盘与解读"
              />
              <ProcessStep
                number="03"
                title="获得洞察"
                description="查看趋势与行动建议"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-12 relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-gold)]/10" />

            <div className="relative">
              <h3
                className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                开启你的命理之旅
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-8">
                免费体验一次完整解读，感受传统智慧与现代科技的完美融合
              </p>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn btn-primary px-8 py-4 text-lg"
              >
                <Sparkles className="w-5 h-5" />
                立即开始
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </main>
  );
}

/* Sub Components */

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">
        {number}
      </div>
      <div className="text-sm text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

function VisionCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-hover p-6 text-center group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function TestimonialCard({
  content,
  author,
  role,
  avatar,
}: {
  content: string;
  author: string;
  role: string;
  avatar: string;
}) {
  return (
    <div className="card card-hover p-6 relative">
      <div className="absolute top-4 left-4 text-4xl text-[var(--color-gold)] opacity-20 font-serif">
        "
      </div>
      <p className="text-[var(--color-text-secondary)] mb-6 pt-6 leading-relaxed">
        {content}
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center text-white font-medium">
          {avatar}
        </div>
        <div>
          <div className="font-medium text-[var(--color-text-primary)]">{author}</div>
          <div className="text-sm text-[var(--color-text-muted)]">{role}</div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="card card-hover p-6 text-center group">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center relative">
      <div className="w-20 h-20 rounded-full glass mx-auto mb-4 flex items-center justify-center">
        <span className="text-2xl font-bold text-gradient-gold">{number}</span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}
