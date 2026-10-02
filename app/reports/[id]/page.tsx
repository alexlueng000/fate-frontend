'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, BookOpen } from 'lucide-react';
import Markdown from '@/app/components/Markdown';
import { historyApi, type ConversationReport } from '@/app/lib/history/api';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { splitReport } from '@/app/lib/report/sections';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { ReviewNotes } from '@/app/components/consultation/ReviewNotes';
import styles from './report.module.css';

const FACT_LABELS: Record<string, string> = { currentSituation: '当前处境', options: '正在考虑的选项', timeframe: '关注的时间范围' };

function Pillars({ chart }: { chart: Record<string, unknown> }) {
  const mingpan = (chart.mingpan ?? chart) as Record<string, unknown>;
  const pillars = mingpan.four_pillars as Record<string, unknown> | undefined;
  return <dl className={styles.pillars}>{['year', 'month', 'day', 'hour'].map((key, i) => {
    const value = pillars?.[key];
    const label = Array.isArray(value) ? value.join('') : typeof value === 'string' ? value : value && typeof value === 'object' ? `${(value as Record<string, unknown>).stem ?? ''}${(value as Record<string, unknown>).branch ?? ''}` : '未记录';
    return <div key={key}><dt>{['年柱', '月柱', '日柱', '时柱'][i]}</dt><dd>{label}</dd></div>;
  })}</dl>;
}

export default function SavedReportPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = Number(rawId);
  const authLoading = useRouteGuard(true, false);
  const [report, setReport] = useState<ConversationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [full, setFull] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    setLoading(true); setError(''); setReport(null);
    if (!Number.isSafeInteger(id) || id < 1) {
      setError('报告地址无效。'); setLoading(false); return;
    }
    historyApi.report(id, controller.signal).then(setReport).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '报告暂时无法加载。');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, authLoading, attempt]);
  const parsed = useMemo(() => splitReport(report?.content ?? ''), [report?.content]);
  const suggestions = useMemo(() => parseSuggestedQuestions(report?.content ?? '').questions, [report?.content]);
  const original = useMemo(() => parseSuggestedQuestions(report?.content ?? '').cleanedContent, [report?.content]);
  const chatPath = report?.type === 'liuyao' ? '/liuyao' : '/chat';
  const continueUrl = `${chatPath}?conv_id=${id}`;
  const openSection = useCallback((index: number) => {
    setFull(false);
    requestAnimationFrame(() => {
      const section = document.getElementById(`saved-section-${index}`);
      if (section instanceof HTMLDetailsElement) section.open = true;
      section?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      section?.focus({ preventScroll: true });
    });
  }, []);
  return <div className={styles.page}>
    <Link href="/history" className={styles.back}><ArrowLeft size={16} aria-hidden />解读记录</Link>
    {(authLoading || loading) ? <p role="status" className={styles.state}>正在打开已保存的报告…</p> : error ? <section className={styles.state}>
      <h1>暂时无法打开报告</h1><p role="alert">{error}</p>
      <div className={styles.links}><button onClick={() => setAttempt(value => value + 1)}>重新加载</button><Link href={continueUrl}>查看原对话</Link></div>
    </section> : report && <>
      <header className={styles.header}>
        <p className={styles.eyebrow}><BookOpen size={16} aria-hidden />{report.type === 'bazi' ? '八字' : '六爻'} · {report.kind === 'personal' ? '个人命理报告' : '问题解读报告'}</p>
        <h1>{report.question || report.task_context?.title || report.title}</h1>
        <p className={styles.caption}>生成于 <time dateTime={report.generated_at}>{new Date(/Z$|[+-]\d\d:\d\d$/.test(report.generated_at) ? report.generated_at : `${report.generated_at}Z`).toLocaleString('zh-CN')}</time> · 已保存到解读记录</p>
        <div className={styles.links}><Link href={continueUrl}>围绕这份报告继续聊<ArrowUpRight size={16} aria-hidden /></Link><button aria-pressed={full} onClick={() => setFull(value => !value)}>{full ? '返回章节阅读' : '查看完整原文'}</button></div>
      </header>
      <details className={styles.context}>
        <summary>本次问题、背景与{report.type === 'bazi' ? '命盘' : '卦象'}</summary>
        {report.question && <><h2>原始问题</h2><p>{report.question}</p></>}
        <h2>你提供的背景</h2>
        {Object.keys(FACT_LABELS).some(key => report.facts[key]) ? <dl className={styles.facts}>{Object.entries(FACT_LABELS).map(([key, label]) => report.facts[key] && <div key={key}><dt>{label}</dt><dd>{report.facts[key]}</dd></div>)}</dl> : <p>这份记录没有单独保存现实背景；原始交流内容可在对话中查看。</p>}
        {report.profile?.bazi_chart && <><h2>本次命盘快照</h2><Pillars chart={report.profile.bazi_chart} /></>}
        {report.profile_changed && <p>出生档案后来有过修改，这里使用解读时保存的命盘。</p>}
        {report.hexagram && <><h2>本次起卦记录</h2><p>{report.hexagram.main_gua} → {report.hexagram.change_gua || '无变卦'} · {report.hexagram.timestamp}</p><p>世爻：{report.hexagram.shi_yao ?? '未记录'} · 应爻：{report.hexagram.ying_yao ?? '未记录'}</p><ul>{report.hexagram.lines?.lines.map(line => <li key={line.position}>{line.position} 爻 · {line.is_yang ? '阳' : '阴'}{line.is_dong ? ' · 动爻' : ''}{line.dizhi ? ` · ${line.dizhi}` : ''}{line.liushou ? ` · ${line.liushou}` : ''}</li>)}</ul></>}
      </details>
      <nav className={styles.navigation} aria-label="报告章节目录">{report.sections.map((section, i) => <button key={i} onClick={() => openSection(i)}>{String(i + 1).padStart(2, '0')}<span>{section.title}</span></button>)}</nav>
      {full ? <article className={styles.section}><Markdown content={original} /></article> : <>
        {parsed.preamble.trim() && <div className={styles.preamble}><Markdown content={`${parsed.preamble}\n\n${parsed.definitions}`} /></div>}
        {report.sections.map((section, i) => <details className={`${styles.section} ${i === 0 ? styles.core : ''}`} key={i} id={`saved-section-${i}`} tabIndex={-1} open={section.title !== '分析依据'}>
          <summary><span className={styles.number}>{String(i + 1).padStart(2, '0')}</span><h2>{section.title}</h2><span className={styles.toggle} aria-hidden>展开 / 收起</span></summary>
          <div className={styles.body}><Markdown content={`${section.body}\n\n${parsed.definitions}`} />{section.title !== '免责声明' && <Link className={styles.ask} href={`${continueUrl}&question=${encodeURIComponent(`关于报告中的“${section.title}”，我想进一步了解其中的建议。`)}`}>针对这一节提问<ArrowUpRight size={15} aria-hidden /></Link>}</div>
        </details>)}
      </>}
      {suggestions.length > 0 && <section className={styles.followups}><p className={styles.eyebrow}>接下来，可以继续探索</p>{suggestions.map(question => <Link key={question} href={`${continueUrl}&question=${encodeURIComponent(question)}`}>{question}<ArrowUpRight size={16} aria-hidden /></Link>)}</section>}
      {report.task_context?.taskType === 'career' && <div className={styles.review}><ReviewNotes conversationId={id} context={report.task_context} /></div>}
      <footer className={styles.footer}>以上为传统文化视角与现实思考参考。建议结合实际信息和你的选择判断。</footer>
    </>}
  </div>;
}
