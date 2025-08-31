// app/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Gender } from '@/app/api';

export default function LandingPage() {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [gender, setGender] = useState<Gender>('男');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      gender,
      calendar: 'gregorian',
      birth_date: date || '',
      birth_time: time || '12:00',
      birthplace: birthplace || '',
      use_true_solar: 'true',
      lat: '0',
      lng: '0',
      longitude: '0',
    });
    router.push(`/chat?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#fef3c7] text-neutral-800 antialiased">
      {/* 细腻纹理与淡色叠影（东方纸感） */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6)_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="absolute -top-24 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.10),transparent_60%)] blur-2xl" />
      </div>

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 shadow-md shadow-red-600/20" />
          <span className="text-lg font-semibold tracking-wide text-red-800">Bazi AI</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          <a href="#features" className="hover:text-red-700">功能</a>
          <a href="#how" className="hover:text-red-700">流程</a>
          <a href="#demo" className="hover:text-red-700">演示</a>
          <a href="#testimonials" className="hover:text-red-700">口碑</a>
          <a
            href="#cta"
            className="rounded-full bg-white/80 px-4 py-2 text-red-700 shadow-sm hover:bg-white transition border border-red-200"
          >
            立即体验
          </a>
        </nav>
      </header>

      {/* Hero 首屏 */}
      <section className="container mx-auto px-4 pt-4 pb-16 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-red-900">
              一分钟，解锁你的
              <strong className="bg-gradient-to-r from-red-700 to-rose-600 bg-clip-text text-transparent">
                专属八字命盘
              </strong>
            </h1>
            <p className="mt-4 text-neutral-700 text-lg">
              融合传统命理与 AI 智能，为你解读
              <span className="text-red-700 font-medium"> 财运 / 感情 / 事业 </span>
              等关键问题。
            </p>

            {/* 表单 */}
            <form
              onSubmit={onSubmit}
              className="mt-8 rounded-2xl border border-red-200 bg-white/90 p-4 md:p-6 shadow-[0_8px_40px_-20px_rgba(220,38,38,0.35)]"
            >
              <div className="mb-3">
                <span className="mb-1 block text-sm text-neutral-700">性别</span>
                <div className="flex gap-3">
                  <label
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition
                    ${
                      gender === '男'
                        ? 'border-red-400 bg-red-50 text-red-800'
                        : 'border-red-200 bg-white/70 text-neutral-700 hover:bg-red-50/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="男"
                      checked={gender === '男'}
                      onChange={() => setGender('男')}
                      className="accent-red-600"
                    />
                    男
                  </label>
                  <label
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition
                    ${
                      gender === '女'
                        ? 'border-red-400 bg-red-50 text-red-800'
                        : 'border-red-200 bg-white/70 text-neutral-700 hover:bg-red-50/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="女"
                      checked={gender === '女'}
                      onChange={() => setGender('女')}
                      className="accent-red-600"
                    />
                    女
                  </label>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm text-neutral-700">出生日期</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 outline-none ring-0 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm text-neutral-700">出生时间（可选）</label>
                  <input
                    type="time"
                    placeholder="12:00"
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 outline-none ring-0 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-neutral-700">出生地点</label>
                  <input
                    type="text"
                    placeholder="广东阳春 / 深圳 / 上海 …"
                    className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 outline-none ring-0 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
                    value={birthplace}
                    onChange={(e) => setBirthplace(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-xl bg-red-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-700 transition"
                >
                  立即生成我的命盘
                </button>
                <a
                  href="/chat"
                  className="inline-flex justify-center rounded-xl border border-red-300 px-6 py-3 text-base font-semibold text-red-700 bg-white/80 hover:bg-red-50 transition"
                >
                  先看看 AI 对话
                </a>
              </div>
              <p className="mt-3 text-xs text-neutral-600">
                已服务 12,000+ 用户 · 数据全程加密，安全无忧
              </p>
            </form>
          </div>

          {/* 右侧预览卡 */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-1 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent_60%)] blur-2xl" />
            <div className="relative rounded-3xl border border-red-200 bg-white/90 p-6 shadow-xl">
              <div className="mb-4 text-sm text-neutral-600">AI 对话预览</div>
              <div className="space-y-3">
                <ChatBubble role="user" text="我最近适合换工作吗？" />
                <ChatBubble role="ai" text="从你的命盘看，财星较旺，近期利于跳槽或合作，可重点关注沟通与资源整合。" />
                <ChatBubble role="user" text="感情方面有什么建议？" />
                <ChatBubble role="ai" text="情感星透显但受制，宜多倾听彼此需求；周三、周六更利于沟通与推进。" />
              </div>
              <div className="mt-6 h-32 rounded-xl border border-red-200 bg-[radial-gradient(ellipse_at_center,rgba(254,243,199,0.8),rgba(255,255,255,0.9))] flex items-center justify-center text-sm text-neutral-600">
                命盘图占位（四柱 / 五行强弱）
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 三步流程 */}
      <section id="how" className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-red-900">只需 3 步，立即获得专属解读</h2>
        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <Step title="输入出生信息" desc="选择日期、时间、地点" />
          <Step title="AI 生成命盘" desc="一键生成四柱与摘要" />
          <Step title="与 AI 对话" desc="解读财运 / 感情 / 事业" />
        </div>
      </section>

      {/* Demo 区 */}
      <section id="demo" className="container mx-auto px-4 py-12 md:py-16">
        <div className="rounded-3xl border border-red-200 bg-white/90 p-6 md:p-10 shadow-[0_8px_40px_-20px_rgba(220,38,38,0.25)]">
          <h3 className="text-xl md:text-2xl font-semibold text-red-900">即时 Demo</h3>
          <p className="mt-2 text-neutral-700">看看它如何回答真实问题：</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <DemoCard
              q="这周的财运如何把握？"
              a="偏财星走强，宜主动沟通与谈判；避免情绪性决策，午后效率更高。"
            />
            <DemoCard
              q="是否适合开始新的关系？"
              a="感情星有机遇但有冲克，建议循序渐进，侧重建立稳定的节奏与边界。"
            />
          </div>
        </div>
      </section>

      {/* 功能卡片 */}
      <section id="features" className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-red-900">核心功能与优势</h2>
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard title="智能排盘" desc="四柱八字，一键生成完整命盘。" />
          <FeatureCard title="AI 解读" desc="随问随答，语义理解你的问题。" />
          <FeatureCard title="历史记录" desc="自动保存与回看，持续洞察变化。" />
          <FeatureCard title="隐私保护" desc="端到端加密存储，仅你本人可见。" />
        </div>
      </section>

      {/* 口碑与背书 */}
      <section id="testimonials" className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            <TestiCard
              name="小A"
              text="用了之后，对职业规划更有方向感！建议也能落到行动点。"
            />
            <TestiCard
              name="小B"
              text="AI 解读比我预想的更贴切，尤其把命盘和现实问题连起来。"
            />
            <TestiCard
              name="小C"
              text="界面温润耐看，历史记录方便我复盘重要节点。"
            />
          </div>
          <div className="mt-8 rounded-2xl border border-red-200 p-4 text-center text-sm text-neutral-700 bg-white/80">
            已有 <span className="text-red-700 font-semibold">12,000+</span> 用户体验 · 获得多平台好评与推荐
          </div>
        </div>
      </section>

      {/* 徽章 */}
      <section className="container mx-auto px-4 pb-6">
        <div className="mx-auto max-w-6xl grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Badge text="数据加密" />
          <Badge text="隐私合规" />
          <Badge text="高可用" />
          <Badge text="7×24 支持" />
        </div>
      </section>

      {/* 底部 CTA */}
      <section id="cta" className="container mx-auto px-4 py-12 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-[linear-gradient(90deg,rgba(220,38,38,0.16),rgba(254,243,199,0.7))] p-6 md:p-10">
          <div className="max-w-3xl">
            <h3 className="text-2xl md:text-3xl font-bold text-red-900">立即开启你的专属命盘解读</h3>
            <p className="mt-2 text-neutral-800/80">
              新用户限时免费体验一次完整排盘与 AI 解读。
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-red-800 hover:opacity-90 transition border border-red-200"
              >
                立即免费排盘
              </a>
              <a
                href="/chat"
                className="inline-flex justify-center rounded-xl border border-white/50 px-6 py-3 text-base font-semibold text-white bg-red-600/90 hover:bg-red-700 transition"
              >
                Web 入口
              </a>
              {/* 二维码占位 */}
              <div className="ml-0 sm:ml-6 mt-2 sm:mt-0 inline-flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg border border-red-200 bg-[repeating-linear-gradient(45deg,rgba(220,38,38,.15)_0_6px,transparent_6px_12px)]" />
                <span className="text-sm text-neutral-800/80">小程序扫码体验</span>
              </div>
            </div>
          </div>
          {/* 右侧柔光 */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-200/60 blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-red-200/80">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-700">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-red-600 to-rose-600" />
            <span>© 2025 Bazi AI</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-red-700">隐私政策</a>
            <a href="/terms" className="hover:text-red-700">使用条款</a>
            <a href="/contact" className="hover:text-red-700">联系我们</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

/* =================== 子组件 =================== */

function ChatBubble({ role, text }: { role: 'user' | 'ai'; text: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow/30 ${
          isUser
            ? 'bg-red-600 text-white rounded-br-sm shadow-lg shadow-red-600/20'
            : 'bg-white/90 text-neutral-800 border border-red-200 rounded-bl-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function Step({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white/90 p-5 text-center shadow-sm">
      <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 shadow ring-1 ring-red-300/30" />
      <div className="text-lg font-semibold text-red-900">{title}</div>
      <div className="mt-1 text-sm text-neutral-700">{desc}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-3 h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 ring-1 ring-red-300/30" />
      <div className="text-base font-semibold text-red-900">{title}</div>
      <div className="mt-1 text-sm text-neutral-700">{desc}</div>
    </div>
  );
}

function DemoCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white/90 p-5">
      <div className="text-neutral-800">
        <span className="text-red-700">用户：</span>
        {q}
      </div>
      <div className="mt-2 rounded-xl border border-red-200 bg-[#fff8ec] p-3 text-neutral-900">
        <span className="text-red-700">AI：</span>
        {a}
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white/90 p-3 text-sm text-neutral-700">
      <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-red-600 to-rose-600" />
      <span>{text}</span>
    </div>
  );
}

function TestiCard({ name, text }: { name: string; text: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white/90 p-6 shadow">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white font-bold">
          {name[0]}
        </div>
        <div className="text-base font-semibold text-red-900">{name}</div>
      </div>
      <p className="text-sm text-neutral-800 leading-relaxed">{text}</p>
      <div className="mt-3 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className="h-4 w-4 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.073 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.073 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.073-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.073-3.292z" />
          </svg>
        ))}
      </div>
    </div>
  );
}
