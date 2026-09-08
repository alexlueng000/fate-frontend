'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from '@/app/profile/create/onboarding.module.css';

export default function ProfileWelcome({ onStart, leaving }: { onStart: () => void; leaving: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const sample = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) return;
    sample.current?.focus({ preventScroll: true });
    sample.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [expanded]);

  return (
    <div className={`${styles.welcome} ${leaving ? styles.leaving : ''}`} inert={leaving}>
      <section className={styles.introduction}>
        <p className={styles.eyebrow}>欢迎来到易凡</p>
        <h1 className={styles.title}>从认识自己，<br />慢慢开始。</h1>
        <p className={styles.description}>接下来，我们会根据你的出生信息，整理一份关于性格、关系与人生节奏的解读。</p>
        <p className={styles.note}>这些信息只需填写一次，以后可以修改。</p>
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary group" onClick={onStart} disabled={leaving}>
            开始填写出生信息 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setExpanded((value) => !value)} aria-controls="reading-example" aria-expanded={expanded} disabled={leaving}>
            {expanded ? '收起解读示例' : '先看看解读示例'}
          </button>
        </div>
        <p className={styles.alternative}>心里正放着一件具体的事？<Link href="/liuyao">也可以先问六爻 <ArrowUpRight size={14} aria-hidden /></Link></p>
      </section>
      <section ref={sample} id="reading-example" tabIndex={-1} aria-label="解读示例" className={styles.sample}>
        <div className={styles.sampleHeader}><span>一份解读，会这样开始</span><span>示例</span></div>
        <p className={styles.sampleKicker}>关于性格 · 一种观察角度</p>
        <h2>有些反复，<br />可能是一种习惯。</h2>
        <p className={styles.sampleBody}>你习惯在行动之前，先把各种可能都想一遍。这份谨慎有时保护了你，也可能让你在已经准备好时，仍然迟迟没有迈出第一步。</p>
        <p className={styles.sampleQuestion}>最近，有没有一件事让你有过这样的感觉？</p>
        {expanded && <div className={styles.sampleExpanded}>
          <h3>把解读放回真实的生活里</h3>
          <p>你可以继续问：“面对一个新机会，我该怎样分清谨慎和担心？”我们会围绕具体处境，把问题一层层说清楚。</p>
          <p>你也可以告诉我们哪里不符合你的感受，继续对照和追问。</p>
        </div>}
        <p className={styles.sampleDisclaimer}>仅展示解读的表达方式，不代表你的个人解读。</p>
      </section>
    </div>
  );
}
