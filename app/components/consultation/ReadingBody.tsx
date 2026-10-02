'use client';

import { useMemo, type ComponentType } from 'react';
import { consultationSections } from '@/app/lib/consultation/sections';
import { EvidencePanel } from './primitives';

export function ReadingBody({ content, streaming, Markdown }: {
  content: string; streaming?: boolean; Markdown: ComponentType<{ content: string }>;
}) {
  const parsed = useMemo(() => streaming ? null : consultationSections(content), [content, streaming]);
  if (!parsed) return <div className="msg-md consult-prose"><Markdown content={content} /></div>;
  return <div className="consult-reading">
    {parsed.preamble.trim() && <Markdown content={parsed.preamble + '\n' + parsed.definitions} />}
    {parsed.sections.map((section, i) => i === 1
      ? <EvidencePanel key={section.id} title="查看分析依据"><div className="msg-md consult-prose"><Markdown content={section.body + '\n' + parsed.definitions} /></div></EvidencePanel>
      : <section key={section.id} className="consult-reading-section">
          <p className="consult-eyebrow">{i === 0 ? '01 · 核心观察' : '02 · 现实建议'}</p>
          <div className="msg-md consult-prose"><Markdown content={section.body + '\n' + parsed.definitions} /></div>
        </section>)}
  </div>;
}
