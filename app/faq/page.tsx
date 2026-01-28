'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Footer from '@/app/components/Footer';

const faqs = [
  // 基础问题
  {
    question: '我不懂八字，可以用吗？',
    answer: '完全可以！无需任何八字基础，直接用自然语言提问即可。我们的 AI 会将专业术语转化为通俗易懂的语言，并提供详细的知识解释。',
  },
  {
    question: '什么是八字？',
    answer: '八字，又称四柱，是中国传统命理学的核心概念。它由出生年、月、日、时四个时间点的天干地支组成，共八个字，故称"八字"。通过分析八字中五行的生克关系，可以了解一个人的性格特点、人生走向等。',
  },
  {
    question: '解读结果准确吗？',
    answer: '我们基于传统八字理论，结合现代概率模型进行分析。结果仅供参考，建议将其作为人生决策的辅助工具，而非绝对依据。命理分析是一种传统文化视角，真正的人生掌握在您自己手中。',
  },
  {
    question: '为什么需要精确的出生时间？',
    answer: '出生时间决定了八字中的"时柱"，对命盘分析有重要影响。时辰不同，命盘可能完全不同。如果不确定具体时间，可以提供大概时间段，系统会给出相应的分析。',
  },
  {
    question: '出生地点有什么作用？',
    answer: '出生地点用于计算"真太阳时"。由于中国幅员辽阔，不同地区的实际太阳时与北京时间存在差异。通过出生地点的经度，我们可以更精确地确定您的出生时辰，提高排盘准确性。',
  },

  // 功能相关
  {
    question: '支持哪些日历类型？',
    answer: '我们同时支持公历（阳历）和农历（阴历）输入。系统会自动进行转换和计算，确保排盘结果的准确性。如果您只知道农历生日，选择农历输入即可。',
  },
  {
    question: '可以多次提问吗？',
    answer: '当然可以！我们支持多轮对话，您可以针对命盘结果进行深入探讨，询问关于事业、感情、健康、财运等各方面的问题。AI 会根据您的命盘特点给出个性化的解读。',
  },
  {
    question: '可以问哪些问题？',
    answer: '您可以询问任何与命理相关的问题，比如：今年的运势如何？适合什么职业？感情方面需要注意什么？什么时候适合做重大决定？五行缺什么？如何改善运势？等等。',
  },
  {
    question: '什么是大运和流年？',
    answer: '大运是指人生中每十年一个阶段的运势走向，反映人生的大趋势。流年则是指每一年的具体运势。大运决定大方向，流年影响具体事件。两者结合分析，可以更全面地了解运势变化。',
  },
  {
    question: '什么是五行？',
    answer: '五行是中国古代哲学的基本概念，包括金、木、水、火、土五种元素。在八字命理中，五行代表不同的性格特质和能量。通过分析八字中五行的强弱和平衡，可以了解一个人的性格优势和需要注意的方面。',
  },

  // 账户与隐私
  {
    question: '如何注册账号？',
    answer: '点击页面右上角的"注册"按钮，填写邮箱和密码即可完成注册。注册后可以保存您的命盘和对话记录，方便随时查看和继续对话。',
  },
  {
    question: '我的隐私会泄露吗？',
    answer: '我们非常重视用户隐私。所有数据采用加密存储，仅您本人可见，绝不向第三方泄露或出售。您可以随时在账户设置中查看、导出或删除自己的数据。',
  },
  {
    question: '数据会保存多久？',
    answer: '您的对话记录和命盘数据会一直保存，直到您主动删除。您可以随时在账户设置中管理和删除您的数据。注销账户后，所有相关数据将被永久删除。',
  },
  {
    question: '忘记密码怎么办？',
    answer: '在登录页面点击"忘记密码"，输入注册时使用的邮箱，我们会发送密码重置链接到您的邮箱。按照邮件中的指引即可重置密码。',
  },

  // 服务与收费
  {
    question: '免费体验包含什么？',
    answer: '免费体验包含一次完整的命盘生成和 AI 深度解读，您可以查看四柱命盘、五行分布、大运流年等完整分析，并进行多轮对话深入了解。',
  },
  {
    question: '服务收费吗？',
    answer: '我们提供免费体验服务，让您先了解我们的分析质量。后续如需更多服务，可以选择付费套餐。具体价格请查看我们的定价页面或联系客服了解。',
  },
  {
    question: '支持哪些支付方式？',
    answer: '我们支持微信支付、支付宝等主流支付方式。支付过程安全便捷，支付成功后服务立即生效。',
  },

  // 技术问题
  {
    question: '支持哪些设备？',
    answer: '我们的服务支持电脑、手机、平板等各种设备。您可以通过网页浏览器访问，也可以使用我们的微信小程序。数据在各设备间同步，随时随地都能使用。',
  },
  {
    question: '页面加载很慢怎么办？',
    answer: '如果遇到加载缓慢的情况，建议：1) 检查网络连接是否正常；2) 尝试刷新页面；3) 清除浏览器缓存后重试；4) 更换浏览器或设备。如问题持续，请联系客服。',
  },
  {
    question: 'AI 回复中断了怎么办？',
    answer: '如果 AI 回复中断，可能是网络波动导致。您可以尝试重新发送问题，或刷新页面后继续对话。您之前的对话记录不会丢失。',
  },
];

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 返回链接 */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          {/* 标题 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] mb-6">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-4xl font-bold text-[var(--color-text-primary)] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              常见问题
            </h1>
            <p className="text-[var(--color-text-muted)]">
              关于服务的常见疑问解答
            </p>
          </div>

          {/* FAQ 列表 */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <span className="font-medium text-[var(--color-text-primary)] pr-8">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[var(--color-gold)] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-[var(--color-text-secondary)] animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 联系提示 */}
          <div className="mt-12 text-center">
            <p className="text-[var(--color-text-secondary)]">
              没有找到您的问题？请
              <Link href="/contact" className="text-[var(--color-primary)] hover:underline mx-1">
                联系我们
              </Link>
              获取帮助
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
