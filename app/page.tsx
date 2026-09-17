import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import AuthGate from '@/app/components/landing/AuthGate';
import { PrimaryCta, SecondaryCta } from '@/app/components/landing/LandingCtas';
import ChartPreview from '@/app/components/landing/ChartPreview';
import styles from '@/app/components/landing/Homepage.module.css';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fateinsight.site";

export const metadata: Metadata = {
  title: "AI八字分析与六爻起卦平台 | 易凡文化",
  description:
    "易凡文化用传统方法结合 AI 分析，提供在线八字分析、八字排盘、六爻起卦与六爻解卦，帮你把性格、关系、选择和当下的问题整理得更清楚。",
  alternates: {
    canonical: '/',
  },
};

/** Structured data: Organization + WebSite. */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "易凡文化",
        url: SITE_URL,
        description:
          "融合传统文化与 AI 技术的八字排盘、性格分析与情绪记录平台。",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "易凡文化",
        inLanguage: "zh-CN",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function LandingPage() {
  return <main className={styles.home}>
    <StructuredData /><AuthGate />
    <section className={styles.hero}><div className={styles.heroInner}>
      <div>
        <p className={styles.eyebrow}>易凡文化 · 八字与六爻</p>
        <h1 className={styles.title}>以八字<em>识自己</em>，<br />以六爻<em>问当下</em>。</h1>
        <p className={styles.lead}>从一张命盘，了解性格与做事方式。<br />从一个具体问题，梳理眼前的选择。<br />看得见依据，读得懂解读，再结合现实作判断。</p>
        <div className={styles.actions}><PrimaryCta entry="hero">八字排盘</PrimaryCta><SecondaryCta entry="hero" event="home_liuyao_cta_click" href="/liuyao" className={styles.secondary}>六爻起卦</SecondaryCta></div>
        <p className={styles.note}>八字需出生日期、时间与地点 · 六爻围绕一件具体的事</p>
        <a href="#choose" className={styles.detailLink}>还不确定？看看哪种适合你的问题 ↓</a>
      </div>
      <ChartPreview />
    </div></section>

    <section id="choose" className={styles.section} style={{ scrollMarginTop: 80 }}>
      <header className={styles.sectionHead}><p>两种视角，各有所长</p><h2>先看你想了解什么。</h2></header>
      <div className={styles.choices}>
        <article className={styles.choice}>
          <span className={styles.choiceNumber}>01 / 八字 · 认识自己</span><h3>看长期特点与阶段趋势</h3>
          <p>根据出生资料生成四柱命盘，以传统命理为参考，讨论性格、做事方式与关系模式。</p>
          <ul className={styles.questions}><li>“我做事有哪些优势和盲点？”</li><li>“什么样的工作方式更适合我？”</li><li>“我在人际关系中容易卡在哪里？”</li></ul>
          <p>你会看到：四柱命盘、分章节报告，以及继续追问的入口。</p><Link href="/analysis/start">开始八字排盘 →</Link>
        </article>
        <article className={styles.choice}>
          <span className={styles.choiceNumber}>02 / 六爻 · 讨论一件事</span><h3>看具体问题与当下条件</h3>
          <p>围绕一件正在发生或考虑中的事情起卦，结合卦象讨论相关因素与需要核实的现实条件。</p>
          <ul className={styles.questions}><li>“这次合作有哪些条件需要确认？”</li><li>“面对这个工作机会，我该关注什么？”</li><li>“这件事接下来有哪些阻力要留意？”</li></ul>
          <p>你会看到：卦象、围绕问题的解读，以及后续讨论入口。</p><Link href="/liuyao">开始六爻起卦 →</Link>
        </article>
      </div>
    </section>

    <div className={styles.stepsWrap}><section className={styles.section}>
      <header className={styles.sectionHead}><p>从输入，到理解</p><h2>不必先学会术语，也能开始。</h2></header>
      <div className={styles.steps}>
        <div><span className={styles.stepNumber}>01</span><h3>提供资料或写下问题</h3><p>八字填写出生资料；六爻选择一件具体的事。信息越清楚，越容易围绕你的问题展开。</p></div>
        <div><span className={styles.stepNumber}>02</span><h3>查看命盘与白话解读</h3><p>程序提供排盘数据，AI 解释传统分析视角。把计算结果、分析依据与现实情况分开理解。</p></div>
        <div><span className={styles.stepNumber}>03</span><h3>补充情况，继续讨论</h3><p>提出疑问、核对不符合的地方，或回看已有解读。把参考意见放回真实生活中判断。</p></div>
      </div>
    </section></div>

    <section className={styles.section}>
      <header className={styles.sectionHead}><p>开始之前</p><h2>你可能还想知道</h2></header>
      {[
        ['八字和六爻，我该选哪一个？', '想了解长期特点、做事方式或关系倾向，选择八字；想围绕具体机会、合作或近期事项讨论，选择六爻。不需要对同一件事反复起卦。'],
        ['不知道准确出生时间怎么办？', '不要为了完成表单随意填写时间。出生时间会影响时柱等结果，目前八字入口需要填写时间，建议先确认资料。若关注一件具体的事，可以选择六爻入口。'],
        ['解读可以当作确定的预测吗？', '不可以。传统命理是文化参考，AI 解读也可能出错。请结合现实信息核对，不依靠解读作投资、医疗、婚姻或职业等重大决定。'],
        ['使用前需要付费吗？', '可用次数与权益以账户和套餐页当前显示为准。开始使用前可以查看套餐说明，确认适用范围。'],
        ['出生资料和问题会公开吗？', '首页展示的是固定示例，不是用户真实资料。个人信息的收集、使用和管理方式请查看隐私政策；避免在问题中填写不必要的敏感信息。'],
      ].map(([question, answer]) => <details key={question} className={styles.faq}><summary>{question}</summary><p>{answer}</p></details>)}
      <p className={styles.note}><Link href="/privacy" className="underline underline-offset-4">隐私政策</Link> · <Link href="/pricing" className="underline underline-offset-4">套餐与额度</Link> · <Link href="/faq" className="underline underline-offset-4">更多常见问题</Link></p>
    </section>
    <section className={styles.final}><h2>从你最关心的一个问题开始。</h2><div className={styles.actions}><PrimaryCta entry="final_cta">八字排盘</PrimaryCta><SecondaryCta entry="final_cta" event="home_liuyao_cta_click" href="/liuyao" className={styles.secondary}>六爻起卦</SecondaryCta></div><p className={styles.note}>AI 生成解读 · 传统文化参考 · 不替代现实判断</p></section>
    <Footer />
  </main>;
}
