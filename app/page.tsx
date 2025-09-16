// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';

import {
  Spark,
  Brain,
  Shield,
  ChatBubble,
  Clock,
  CheckCircleSolid,
} from 'iconoir-react';

import Logo from '@/app/public/fate-logo.png';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#fff7e8] text-neutral-800 antialiased flex flex-col">
      {/* Hero 首屏 */}
      <section className="flex flex-1 items-center justify-center px-4 py-20 mt-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-[#a83232]">
            一盏大师 · 八字 AI 解读
          </h1>
          <p className="mt-4 text-lg text-[#4a2c2a]">
            一分钟生成命盘 · AI 智能解读 · 财运 / 感情 / 事业全覆盖
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a83232] px-6 py-3 text-base font-semibold text-[#fff7e8] shadow hover:bg-[#8c2b2b] transition"
            >
              <ChatBubble width={24} height={24} />
              立即开始对话
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#a83232] px-6 py-3 text-base font-semibold text-[#a83232] bg-white/70 hover:bg-[#fdeecf] transition"
            >
              <CheckCircleSolid width={24} height={24} />
              免费创建账户
            </Link>
          </div>
        </div>
      </section>

      {/* 核心功能与优势 */}
      <section id="features" className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#a83232]">
          核心功能与优势
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Spark width={36} height={36} />}
            title="一键上手"
            desc="无需复杂表单，直接发问即可。"
          />
          <FeatureCard
            icon={<Brain width={36} height={36} />}
            title="解释到行动"
            desc="不止命理描述，更给方法与节奏。"
          />
          <FeatureCard
            icon={<Shield width={36} height={36} />}
            title="隐私安全"
            desc="端到端加密存储，仅你本人可见。"
          />
        </div>
      </section>

      {/* 使用流程 */}
      <section id="how" className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#a83232]">
          使用流程
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          <Step
            icon={<CheckCircleSolid width={28} height={28} />}
            title="登录 / 注册"
            desc="1 分钟搞定"
          />
          <Step
            icon={<ChatBubble width={28} height={28} />}
            title="提出问题"
            desc="直接用自然语言"
          />
          <Step
            icon={<Clock width={28} height={28} />}
            title="获得建议"
            desc="清晰、可执行"
          />
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-[#a83232]">
          现在就开始与 Bazi AI 对话
        </h3>
        <p className="mt-2 text-[#4a2c2a]">新用户限时免费体验一次完整解读</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a83232] px-6 py-3 text-base font-semibold text-[#fff7e8] shadow hover:bg-[#8c2b2b] transition"
          >
            <ChatBubble width={24} height={24} />
            进入对话
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#a83232] px-6 py-3 text-base font-semibold text-[#a83232] bg-white/70 hover:bg-[#fdeecf] transition"
          >
            <CheckCircleSolid width={24} height={24} />
            创建账户
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#f0d9a6] bg-[#fffdf6]">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#4a2c2a]">
          <div className="flex items-center gap-3">
            <Image src={Logo} alt="Logo" className="h-6 w-6" />
            <span>© 2025 一盏大师</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#a83232]">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-[#a83232]">
              使用条款
            </Link>
            <Link href="/contact" className="hover:text-[#a83232]">
              联系我们
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

/* 子组件 */
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5c07b] bg-white/90 p-6 shadow-sm text-center">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#a83232] to-[#e5c07b] text-white">
        <span className="[&>svg]:h-8 [&>svg]:w-8">{icon}</span>
      </div>
      <div className="text-lg font-semibold text-[#a83232]">{title}</div>
      <div className="mt-2 text-sm text-[#4a2c2a]">{desc}</div>
    </div>
  );
}

function Step({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5c07b] bg-white/90 p-6 text-center shadow-sm">
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#a83232] text-white">
        <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      </div>
      <div className="text-base font-semibold text-[#a83232]">{title}</div>
      <div className="mt-1 text-sm text-[#4a2c2a]">{desc}</div>
    </div>
  );
}
