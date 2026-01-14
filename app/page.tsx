'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle,
  CheckCircle,
  Zap,
  Lightbulb,
  Lock,
  Coins,
  TrendingUp,
  Heart,
  Briefcase,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Logo from '@/app/public/fate-logo.png';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7f3ed] to-[#f5ede1] antialiased relative overflow-hidden">
      {/* Background Decorations */}
      <div className="bg-decoration">
        <div className="bg-circle w-96 h-96 -top-48 -left-48" />
        <div className="bg-circle w-80 h-80 top-1/4 -right-40" />
        <div className="bg-circle w-64 h-64 bottom-1/4 -left-32" />
        <div className="bg-circle w-72 h-72 -bottom-36 right-1/4" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-[#c93b3a] mb-6">
            一盏大师 · AI 八字解读
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-[#3a332d] max-w-2xl mx-auto">
            1分钟生成命盘 · 智能分析财运感情事业 · 给你可执行的建议
          </p>

          {/* 卖点标签 */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Tag icon={<Zap />} text="秒级响应" />
            <Tag icon={<Lightbulb />} text="行动指南" />
            <Tag icon={<Lock />} text="隐私安全" />
            <Tag icon={<Coins />} text="高性价比" />
          </div>

          {/* CTA 按钮 */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c93b3a] to-[#e45c5c] px-8 py-4 text-lg font-semibold text-white shadow-[0_12px_32px_rgba(201,59,58,0.35),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_16px_40px_rgba(201,59,58,0.4)] hover:-translate-y-px active:scale-[0.98] transition-all duration-300"
            >
              <MessageCircle width={24} height={24} />
              立即开始解读
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#c93b3a] px-8 py-4 text-lg font-semibold text-[#c93b3a] bg-white/70 hover:bg-[#fdeecf] active:scale-[0.98] transition-all"
            >
              <CheckCircle width={24} height={24} />
              免费创建账户
            </Link>
          </div>
        </div>
      </section>

      {/* 痛点场景 Section */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-[#c93b3a] mb-4">
            你是否也曾困惑...
          </h2>
          <p className="text-center text-[#8e8174] mb-6 max-w-2xl mx-auto">
            人生路上总有迷茫，一盏大师用传统智慧 + AI 洞察，帮你找到答案
          </p>
          <p className="text-center text-sm text-[#b8a89a] mb-12">
            已帮助 <span className="text-[#c93b3a] font-semibold">50,000+</span> 用户获得人生指引
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <ProblemCard
              icon={<Briefcase />}
              title="事业方向迷茫"
              description="不知道何时是转机？"
              detail="工作遇到瓶颈，不知道该坚持还是转型？大运流年如何影响你的事业运势？"
              color="#c93b3a"
            />
            <ProblemCard
              icon={<Heart />}
              title="感情波折不断"
              description="正缘何时会出现？"
              detail="单身多年等待缘分，或是感情路上坎坷重重？八字告诉你什么时候桃花最旺。"
              color="#e45c5c"
            />
            <ProblemCard
              icon={<TrendingUp />}
              title="财运起伏不定"
              description="投资时机如何把握？"
              detail="财运时好时坏，不知道什么时候适合投资、什么时候应该保守？"
              color="#C4A574"
            />
            <ProblemCard
              icon={<Activity />}
              title="健康需要关注"
              description="哪些时段要多加留意？"
              detail="身体是革命的本钱，通过八字了解自己的健康隐患，提前做好预防。"
              color="#4a9c6d"
            />
          </div>

          <p className="text-center mt-12 text-[#8e8174] max-w-2xl mx-auto">
            每个人的人生都有起伏，关键是在对的时机做出对的选择。<br className="hidden md:inline" />
            <span className="text-[#c93b3a] font-medium">一盏大师</span> 用八字智慧 + AI 分析，为你指明方向。
          </p>
        </div>
      </section>

      {/* 使用流程 Section */}
      <section className="relative z-10 py-16 md:py-24 bg-[#fffbf7]/50">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-[#c93b3a] mb-16">
            三步获取你的专属解读
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="输入出生信息"
              description="只需提供出生日期和时间"
              icon={<CheckCircle />}
            />
            <ArrowRight />
            <StepCard
              number="2"
              title="AI 智能解读"
              description="秒级生成命盘与深度分析"
              icon={<Zap />}
            />
            <ArrowRight />
            <StepCard
              number="3"
              title="获得行动建议"
              description="不只是解读，更给你可行方案"
              icon={<Lightbulb />}
            />
          </div>

          <p className="text-center mt-12 text-[#8e8174]">
            无需懂八字，自然语言提问即可
          </p>
        </div>
      </section>

      {/* 核心优势 Section */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-[#c93b3a] mb-16">
            为什么选择一盏大师
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Zap />}
              title="快速解读"
              description="传统大师约读需等待数天"
              highlight="AI 解读秒级响应"
            />
            <FeatureCard
              icon={<Lightbulb />}
              title="行动建议"
              description='不只告诉你"是什么"'
              highlight='更给你"怎么做"'
            />
            <FeatureCard
              icon={<Lock />}
              title="隐私安全"
              description="端到端加密存储"
              highlight="仅你本人可见"
            />
            <FeatureCard
              icon={<Coins />}
              title="高性价比"
              description="只需传统咨询的零头"
              highlight="新用户免费体验"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 md:py-24 bg-[#fffbf7]/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-[#c93b3a] mb-12">
            常见问题
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === index}
                onToggle={() => toggleFaq(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-[#c93b3a] to-[#e45c5c] p-12 shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              新用户限时免费体验
            </h3>
            <p className="text-white/90 text-lg mb-8">
              注册即可获得一次完整解读机会，满意后再选择套餐
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-[#c93b3a] shadow-lg hover:shadow-xl hover:-translate-y-px active:scale-[0.98] transition-all duration-300"
            >
              <CheckCircle width={24} height={24} />
              立即免费体验
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(142,129,116,0.15)] bg-[#fffbf7]">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#3a332d]">
          <div className="flex items-center gap-3">
            <Image src={Logo} alt="Logo" className="h-6 w-6" />
            <span>© 2025 一盏大师</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#c93b3a] transition-colors">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-[#c93b3a] transition-colors">
              使用条款
            </Link>
            <Link href="/contact" className="hover:text-[#c93b3a] transition-colors">
              联系我们
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

/* 子组件 */
function Tag({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm border border-[rgba(142,129,116,0.15)] text-[#3a332d]">
      <span className="text-[#c93b3a]">{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}

function ProblemCard({
  icon,
  title,
  description,
  detail,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fffbf7] p-6 shadow-[0_16px_48px_rgba(26,24,22,0.06),0_0_0_1px_rgba(255,255,255,0.5)_inset] border border-[rgba(142,129,116,0.15)] hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 h-14 w-14 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <span className="[&>svg]:h-7 [&>svg]:w-7">{icon}</span>
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-[#1a1816] mb-1">{title}</div>
          <div className="text-sm text-[#c93b3a] mb-2">{description}</div>
          <div className="text-xs text-[#8e8174] leading-relaxed">{detail}</div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex-1 text-center">
      <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#c93b3a] to-[#e45c5c] text-white shadow-lg">
        <span className="[&>svg]:h-10 [&>svg]:w-10">{icon}</span>
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C4A574] text-white text-sm font-bold">
          {number}
        </span>
        <span className="text-lg font-semibold text-[#1a1816]">{title}</span>
      </div>
      <p className="text-sm text-[#8e8174]">{description}</p>
    </div>
  );
}

function ArrowRight() {
  return (
    <div className="hidden md:flex items-center justify-center text-[#C4A574]">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fffbf7] p-6 shadow-[0_16px_48px_rgba(26,24,22,0.06),0_0_0_1px_rgba(255,255,255,0.5)_inset] border border-[rgba(142,129,116,0.15)] hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#c93b3a] to-[#e45c5c] text-white">
        <span className="[&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      </div>
      <div className="text-lg font-semibold text-[#c93b3a] mb-2">{title}</div>
      <div className="text-sm text-[#8e8174] mb-3">{description}</div>
      <div className="text-sm font-medium text-[#1a1816]">{highlight}</div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl bg-white border border-[rgba(142,129,116,0.15)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#fffbf7] transition-colors"
      >
        <span className="font-medium text-[#1a1816] pr-8">{question}</span>
        {isOpen ? <ChevronUp className="text-[#c93b3a] flex-shrink-0" /> : <ChevronDown className="text-[#8e8174] flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-[#3a332d] animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

const faqs = [
  {
    question: '我不懂八字，可以用吗？',
    answer: '完全可以！无需任何八字基础，直接用自然语言提问即可。我们的 AI 会将专业术语转化为通俗易懂的语言。',
  },
  {
    question: '解读准确吗？',
    answer: '基于传统八字理论，结合 AI 大数据分析，提供专业解读参考。但我们建议将结果作为生活参考，而非绝对命运。',
  },
  {
    question: '我的隐私会泄露吗？',
    answer: '所有数据端到端加密存储，仅你本人可见，绝不向第三方泄露。你可以随时删除自己的数据。',
  },
  {
    question: '新用户如何免费体验？',
    answer: '注册即可获得一次免费完整解读机会，包括命盘生成和 AI 深度解读。满意后再根据需要选择套餐。',
  },
];
