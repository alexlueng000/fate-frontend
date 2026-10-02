'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, authHeaders, getJSON, postJSON } from '@/app/lib/api';
import type { CareerTaskContext } from '@/app/lib/tasks/career';
import { EvidencePanel } from './primitives';

type Note = { id: number; content: string | null; created_at: string; review_due_at: string | null };
export function ReviewNotes({ conversationId, context }: { conversationId: number; context: CareerTaskContext }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const taskId = `conversation:${conversationId}`;
  const refresh = useCallback(async () => setNotes(await getJSON<Note[]>(api(`/career-progress?task_id=${encodeURIComponent(taskId)}`), { headers: authHeaders() })), [taskId]);
  useEffect(() => { void refresh().catch(() => setError('复盘记录暂时无法加载')); }, [refresh]);
  async function save() {
    if (busy || !content.trim()) return;
    setBusy(true); setError('');
    try {
      await postJSON(api('/career-progress'), { task_id: taskId, task_context: context, content: content.trim(), review_due_at: date ? new Date(`${date}T09:00:00`).toISOString() : null }, { headers: authHeaders() });
      setContent(''); setDate(''); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : '保存失败，请重试'); }
    finally { setBusy(false); }
  }
  return <EvidencePanel title="我的行动与复盘">
    <p className="mb-4 text-sm leading-7 text-[var(--color-text-secondary)]">写下你自己选择的下一步，或记录现实中发生的变化。这里的记录用于回顾，不会自动当作 AI 已确认的事实。</p>
    <label className="block text-sm">行动或变化<textarea className="consult-field mt-2" rows={3} maxLength={2000} value={content} onChange={e => setContent(e.target.value)} /></label>
    <label className="mt-4 block text-sm">计划复盘日期（选填）<input className="consult-field mt-2" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
    <p className="mt-2 text-xs text-[var(--color-text-muted)]">日期仅保存在记录中，不会自动发送通知。</p>
    <button className="consult-primary my-4" disabled={busy || !content.trim()} onClick={() => void save()}>{busy ? '正在保存…' : '保存我的记录'}</button>
    {error && <p role="alert" className="text-sm text-[var(--color-primary)]">{error}</p>}
    <ul className="space-y-4">{notes.map(note => <li key={note.id} className="border-t border-[var(--color-border)] pt-4"><p className="whitespace-pre-wrap break-words leading-7">{note.content}</p>{note.review_due_at && <p className="mt-2 text-sm text-[var(--color-text-muted)]">计划复盘：{note.review_due_at.slice(0, 10)}</p>}</li>)}</ul>
  </EvidencePanel>;
}
