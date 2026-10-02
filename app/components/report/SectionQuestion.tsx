'use client';

import { useState } from 'react';
import Link from 'next/link';
import Markdown from '@/app/components/Markdown';
import { TurnRecovery } from '@/app/components/chat/TurnRecovery';
import { useUser } from '@/app/lib/auth';
import { useSavedBaziTurn } from '@/app/lib/chat/useSavedBaziTurn';
import type { Msg } from '@/app/lib/chat/types';
import { chapterQuestion, type ReportSection } from '@/app/lib/report/sections';

export default function SectionQuestion({ section, conversationId, onClose }: {
  section: ReportSection; conversationId: string | null; onClose: () => void;
}) {
  const { user } = useUser();
  const suggestedInput = chapterQuestion(section.title, section.source);
  const [draft, setDraft] = useState(suggestedInput);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [answer, setAnswer] = useState('');
  const [sendError, setSendError] = useState('');
  const turn = useSavedBaziTurn({ owner: user?.id, cid: conversationId, input: draft, setInput: setDraft,
    setMessages, taskContext: null, onRestored: () => {}, onAnswer: content => { setAnswer(content); setSendError(''); }, suggestedInput });
  const streamed = [...messages].reverse().find(message => message.role === 'assistant' && message.streaming)?.content;
  async function send() {
    setSendError('');
    try { if (await turn.run(draft.trim())) setDraft(''); }
    catch (failure) { setSendError(failure instanceof Error ? failure.message : '回复暂时未能完成。'); }
  }
  return <section aria-label="章节追问" className="my-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
    <div className="flex items-center justify-between gap-3"><h3 className="font-serif text-lg">{turn.hasDraft ? '待确认的追问' : `追问：${section.title}`}</h3><button type="button" onClick={onClose} className="min-h-11 px-3 text-sm">关闭</button></div>
    <label htmlFor="section-question" className="mt-3 block text-sm">发送内容（可编辑，包含引用原文）</label>
    <textarea autoFocus id="section-question" value={draft} onChange={event => turn.onInputChange(event.target.value)} disabled={turn.busy} placeholder="补充你的问题或现实处境…" rows={8} className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm leading-6" />
    {!conversationId && <p className="my-3 text-sm text-[var(--color-text-secondary)]">这份历史报告没有可核实的关联会话，暂不能直接发送章节追问。你可以复制上方问题；原报告不会重新生成。</p>}
    <button type="button" disabled={!user || !conversationId || turn.busy || turn.blocked || !draft.trim()} onClick={send} className="btn btn-primary mt-3 disabled:opacity-50">{turn.busy ? '正在检查或回复…' : '发送追问'}</button>
    {turn.busy && <button type="button" onClick={turn.stop} className="ml-4 min-h-11 text-sm">停止</button>}
    {conversationId && <Link href={`/chat?conv_id=${conversationId.replace(/^(bazi_conv_|conv_)/, '')}`} className="ml-4 inline-flex min-h-11 items-center text-sm text-[var(--color-primary)]">查看原对话</Link>}
    {sendError && <p className="mt-3 text-sm text-[var(--color-primary)]">{sendError}</p>}
    <div className="mt-3"><TurnRecovery {...turn} /></div>
    {streamed && <div aria-live="polite" className="mt-5 border-t border-[var(--color-border)] pt-4"><p className="mb-3 text-xs text-[var(--color-text-muted)]">正在回复，完成保存后才计次。</p><Markdown content={streamed} /></div>}
    {answer && !streamed && <div className="mt-5 border-t border-[var(--color-border)] pt-4"><p className="mb-3 text-xs text-[var(--color-text-muted)]">已完成的追问回复</p><Markdown content={answer} /></div>}
  </section>;
}
