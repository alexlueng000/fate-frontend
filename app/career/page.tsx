'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { buildCareerTaskHref, buildCareerBaziPrompt, createCareerTaskContext, savePendingCareerBaziPrompt, saveCareerTaskContext, type CareerTaskMode } from '@/app/lib/tasks/career';
import { trackEvent } from '@/app/lib/analytics/track';
import { ContextDrawer } from '@/app/components/consultation/primitives';

const EXAMPLES = ['我想找到更适合自己的职业方向', '现在的工作没有成长，下一步怎么走？', '收到一个新 offer，我该考虑哪些条件？'];

export default function CareerTaskPage() {
  const router = useRouter();
  const loading = useRouteGuard(true, false);
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [currentSituation, setSituation] = useState('');
  const [options, setOptions] = useState('');
  const [timeframe, setTimeframe] = useState('未来 30 天');
  const [mode, setMode] = useState<CareerTaskMode>('bazi');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!loading) trackEvent('career_triage_view'); }, [loading]);
  useEffect(() => {
    if (step > 0) document.getElementById('career-step-title')?.focus();
  }, [step]);

  function next() {
    if (topic.trim().length < 4) { setError('请用一句话描述你想了解的事业问题。'); return; }
    if (step === 1 && mode === 'liuyao' && !options.trim()) { setError('请补充这次要讨论的具体机会或选项。'); return; }
    setError(''); setStep(step + 1);
  }
  function start() {
    if (starting) return;
    setStarting(true);
    const draft = { mode, topic, currentSituation, options, timeframe };
    saveCareerTaskContext(createCareerTaskContext(draft));
    if (mode === 'bazi') savePendingCareerBaziPrompt(buildCareerBaziPrompt(draft));
    trackEvent('career_triage_submit', { payload: { mode, has_topic: true, has_current_situation: Boolean(currentSituation.trim()), has_options: Boolean(options.trim()) } });
    router.push(buildCareerTaskHref(draft));
  }
  if (loading) return <main className="consult-page" aria-busy="true">正在准备事业解读…</main>;
  return <main className="consult-page">
    <Link href="/dashboard" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-text-secondary)]"><ArrowLeft size={16} />返回首页</Link>
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
      <p className="consult-eyebrow !mb-0">事业 · 把下一步想清楚</p>
      <span className="text-sm text-[var(--color-text-muted)]">{step + 1} / 3</span>
    </div>
    <ol aria-label="提问进度" className="my-6 flex gap-6 text-sm">
      {['说说问题', '补充背景', '确认开始'].map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className={index === step ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}>{label}</li>)}
    </ol>
    {step === 0 && <section>
      <h1 id="career-step-title" tabIndex={-1}>最近，工作上的什么事<br />让你停下来想了想？</h1>
      <p className="my-5 leading-7 text-[var(--color-text-secondary)]">不需要懂命理术语。先说出问题，我们再一起整理背景和选择。</p>
      <label htmlFor="career-question" className="mb-2 block text-sm">你的问题 <span className="text-[var(--color-primary)]">必填</span></label>
      <textarea id="career-question" className="consult-field" rows={4} maxLength={400} value={topic} onChange={e => setTopic(e.target.value)} placeholder="例如：我想换工作，但不确定自己真正想要什么。" aria-describedby={error ? 'career-error' : undefined} />
      <p className="mt-5 mb-3 text-sm text-[var(--color-text-muted)]">也可以从这里开始</p>
      <div className="grid gap-2">{EXAMPLES.map(question => <button type="button" key={question} onClick={() => { setTopic(question); document.getElementById('career-question')?.focus(); }} className="consult-secondary text-left text-sm">{question}</button>)}</div>
    </section>}
    {step === 1 && <section>
      <h1 id="career-step-title" tabIndex={-1}>这次，你更想理清什么？</h1>
      <p className="my-5 leading-7 text-[var(--color-text-secondary)]">{topic}</p>
      <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">解读方向</legend>
        {([{ value: 'bazi', title: '了解长期方向', text: '结合八字，探索工作特点和阶段。' }, { value: 'liuyao', title: '讨论具体选择', text: '带着明确事项起卦，整理观察与行动。' }] as const).map(item => <label key={item.value} className={`cursor-pointer border p-5 ${mode === item.value ? 'border-[var(--color-primary)] bg-[var(--color-bg-alt)]' : 'border-[var(--color-border)]'}`}>
          <input type="radio" name="career-mode" value={item.value} checked={mode === item.value} onChange={() => setMode(item.value)} className="mr-2 accent-[var(--color-primary)]" />{item.title}<p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{item.text}</p>
        </label>)}
      </fieldset>
      <label className="mt-6 block"><span className="mb-2 block text-sm">当前处境（选填）</span><textarea rows={3} maxLength={1200} className="consult-field" value={currentSituation} onChange={e => setSituation(e.target.value)} placeholder="有哪些已知条件、担心或现实限制？只填写你愿意分享的内容。" /></label>
      <label className="mt-5 block"><span className="mb-2 block text-sm">具体机会或选项{mode === 'liuyao' ? '（必填）' : '（选填）'}</span><textarea rows={2} maxLength={800} className="consult-field" value={options} onChange={e => setOptions(e.target.value)} placeholder="例如：留在现岗位，或接受一家新公司的 offer。" /></label>
      <label className="mt-5 block"><span className="mb-2 block text-sm">希望关注的时间范围</span><input className="consult-field" maxLength={100} value={timeframe} onChange={e => setTimeframe(e.target.value)} placeholder="例如：未来 30 天，或 offer 的答复期限" /></label>
    </section>}
    {step === 2 && <section>
      <h1 id="career-step-title" tabIndex={-1}>从这个问题开始。</h1>
      <p className="my-6 text-xl leading-8">{topic}</p>
      <dl className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {[['解读方向', mode === 'bazi' ? '八字 · 长期方向' : '六爻 · 具体事项'], ['当前背景', currentSituation || '未补充'], ['机会或选项', options || '未指定'], ['关注时间', timeframe || '未指定']].map(([label, value]) => <div key={label} className="grid grid-cols-[100px_1fr] gap-4 py-4"><dt className="text-sm text-[var(--color-text-muted)]">{label}</dt><dd className="whitespace-pre-wrap break-words leading-7">{value}</dd></div>)}
      </dl>
      <p className="mt-5 text-sm leading-7 text-[var(--color-text-secondary)]">{mode === 'bazi' ? '下一步使用你的出生档案。如尚未建档，会先引导补充。' : '下一步完成起卦，再进入这件事的解读。'} 解读提供传统文化视角与现实行动参考，决定由你做出。</p>
      <ContextDrawer title="本次解读会怎样进行" description="围绕一个问题展开，避免重复填写。" trigger={<button className="mt-4 consult-secondary">了解解读流程</button>}>
        <ol className="space-y-5 leading-7"><li>1. 确认必要信息，缺少关键条件时先澄清。</li><li>2. 展示核心观察，可展开查看分析依据。</li><li>3. 围绕同一问题追问，记录你愿意尝试的行动。</li><li>4. 从历史记录继续讨论和复盘。</li></ol>
        <p className="mt-6 text-sm leading-7 text-[var(--color-text-secondary)]">进入页面不会扣除次数。实际提问按当前账号权益处理，购买前会明确展示适用范围。</p>
      </ContextDrawer>
    </section>}
    {error && <p id="career-error" role="alert" className="mt-4 text-[var(--color-primary)]">{error}</p>}
    <div className="mt-8 flex items-center justify-between gap-4">
      {step > 0 ? <button className="consult-secondary" onClick={() => { setError(''); setStep(step - 1); }}>上一步</button> : <Link href="/panel" className="text-sm underline underline-offset-4">直接进入对话</Link>}
      <button className="consult-primary inline-flex items-center gap-3" disabled={starting || (step === 0 && topic.trim().length < 4)} onClick={step === 2 ? start : next}>{starting ? '正在进入…' : step === 2 ? (mode === 'bazi' ? '开始事业解读' : '前往起卦') : '继续'}<ArrowRight size={16} /></button>
    </div>
  </main>;
}
