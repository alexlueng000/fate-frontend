'use client';

import { useMemo, useState } from 'react';
import Markdown from '@/app/components/Markdown';
import { splitReport, type ReportSection } from '@/app/lib/report/sections';

export default function ReportReader({ content, streaming, onAsk }: {
  content: string; streaming: boolean; onAsk: (section: ReportSection) => void;
}) {
  const report = useMemo(() => splitReport(streaming ? '' : content), [content, streaming]);
  const [full, setFull] = useState(false);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const render = (source: string) => <Markdown content={`${source}\n\n${report.definitions}`} />;
  const openSection = (id: string) => {
    setClosed(current => { const next = new Set(current); next.delete(id); return next; });
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ block: 'start' });
      element?.focus({ preventScroll: true });
    });
  };
  if (streaming) return <div><p role="status" className="mb-4 text-sm text-[var(--color-text-muted)]">正在生成，完成后将整理为章节。</p><Markdown content={content} /></div>;
  if (!report.sections.length) return <div><p className="mb-4 text-sm text-[var(--color-text-muted)]">这份报告没有可识别的章节标题，以下保留完整原文。</p><Markdown content={content} /></div>;
  return (
    <div>
      <div className="mb-6 border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg">阅读目录</h2>
          <button type="button" className="text-sm underline underline-offset-4" onClick={() => setFull(value => !value)}>{full ? '返回章节阅读' : '查看完整原文'}</button>
        </div>
        {!report.standard && <p className="mt-2 text-xs text-[var(--color-text-muted)]">按原有标题整理，未补写或删除章节。</p>}
        {!full && <>
          <nav aria-label="报告章节目录" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {report.sections.map((section, i) => <button type="button" key={section.id} onClick={() => openSection(section.id)} className="min-h-11 rounded border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">{String(i + 1).padStart(2, '0')} · {section.title || '未命名章节'}</button>)}
          </nav>
          <div className="mt-4 flex gap-4 text-xs underline underline-offset-4">
            <button type="button" onClick={() => setClosed(new Set())}>全部展开</button>
            <button type="button" onClick={() => setClosed(new Set(report.sections.map(section => section.id)))}>全部收起</button>
          </div>
        </>}
      </div>
      {full ? <Markdown content={content} /> : <>
        {report.preamble.trim() && <div className="mb-6">{render(report.preamble)}</div>}
        {report.sections.map(section => <section key={section.id} className="mb-4 border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <h3>
            <button id={section.id} type="button" aria-expanded={!closed.has(section.id)} aria-controls={`${section.id}-body`} onClick={() => setClosed(current => { const next = new Set(current); if (next.has(section.id)) next.delete(section.id); else next.add(section.id); return next; })} className="flex min-h-16 w-full scroll-mt-20 items-center justify-between gap-4 px-5 py-4 text-left font-serif text-lg focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">
              <span>{section.title || '未命名章节'}</span><span className="shrink-0 text-xs text-[var(--color-text-muted)]">{closed.has(section.id) ? '展开' : '收起'}</span>
            </button>
          </h3>
          <div id={`${section.id}-body`} hidden={closed.has(section.id)} className="border-t border-[var(--color-border)] px-5 py-4">
            {render(section.introduction)}
            {section.years.map((year, i) => <details key={i} open className="my-3 border-l-2 border-[var(--color-border)] pl-4"><summary className="cursor-pointer py-2 font-medium">{year.title || '未命名小节'}</summary>{render(year.source)}</details>)}
            {section.title !== '免责声明' && <button type="button" onClick={() => onAsk(section)} className="mt-4 min-h-11 rounded border border-[var(--color-border)] px-4 text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]">针对这一节提问</button>}
          </div>
        </section>)}
      </>}
    </div>
  );
}
