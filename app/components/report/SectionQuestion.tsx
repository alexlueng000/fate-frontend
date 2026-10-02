'use client';

import { useEffect, useRef, useState } from 'react';
import Markdown from '@/app/components/Markdown';
import { api } from '@/app/lib/api';
import { trySSE } from '@/app/lib/chat/sse';
import type { ReportSection } from '@/app/lib/report/sections';

export default function SectionQuestion({ section, conversationId, onClose }: {
  section: ReportSection; conversationId: string | null; onClose: () => void;
}) {
  const [draft, setDraft] = useState(`关于报告中的“${section.title}”，请解释主要依据，并说明需要我补充哪些现实信息。\n\n引用报告原文：\n${section.source.trim()}`);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function send() {
    if (!conversationId || !draft.trim() || locked.current) return;
    locked.current = true;
    setBusy(true); setError(''); setAnswer('');
    controller.current = new AbortController();
    try {
      await trySSE(api('/chat'), { conversation_id: conversationId, message: draft.trim() }, setAnswer, undefined, { signal: controller.current.signal });
    } catch {
      setError('本次回复未完成。已保留问题和收到的内容；再次发送前请核对会话，避免重复提交。');
    } finally { setBusy(false); locked.current = false; }
  }
  return <section aria-label="章节追问" className="my-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
    <div className="flex items-center justify-between gap-3"><h3 className="font-serif text-lg">追问：{section.title}</h3><button type="button" onClick={onClose} className="min-h-11 px-3 text-sm">关闭</button></div>
    <label htmlFor="section-question" className="mt-3 block text-sm">发送内容（可编辑，包含引用原文）</label>
    <textarea autoFocus id="section-question" value={draft} onChange={event => setDraft(event.target.value)} disabled={busy} rows={8} className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm leading-6" />
    {!conversationId && <p className="my-3 text-sm text-[var(--color-text-secondary)]">这份历史报告没有可核实的关联会话，暂不能直接发送章节追问。你可以复制上方问题；原报告不会重新生成。</p>}
    <button type="button" disabled={!conversationId || busy || !draft.trim()} onClick={send} className="btn btn-primary mt-3 disabled:opacity-50">{busy ? '正在回复…' : '发送追问'}</button>
    {busy && <button type="button" onClick={() => controller.current?.abort()} className="ml-4 min-h-11 text-sm">停止</button>}
    {error && <p role="alert" className="mt-3 text-sm text-[var(--color-primary)]">{error}</p>}
    {answer && <div className="mt-5 border-t border-[var(--color-border)] pt-4"><Markdown content={answer} /></div>}
  </section>;
}
