'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { digestRequest, type ConversationListItem } from '@/app/lib/history/api';
import { trackEvent } from '@/app/lib/analytics/track';
import styles from './history.module.css';

const TOPICS: Record<string, string> = { CAREER: '事业', WEALTH: '财富', RELATIONSHIP: '关系', SELF: '自我', FAMILY: '家庭', STUDY: '学业', HEALTH: '健康', OTHER: '其他' };

export default function HistoryRecord({ item, type, onContinue, onChange, onDelete, disabled }: {
  item: ConversationListItem; type: 'bazi' | 'liuyao'; onContinue: () => void;
  onChange: (item: ConversationListItem) => void; onDelete: () => void; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const itemRef = useRef(item);
  const changeRef = useRef(onChange);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(false);
  itemRef.current = item;
  changeRef.current = onChange;
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!expanded || item.digest?.status !== 'pending') return;
    const controller = new AbortController();
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const digest = await digestRequest(item.id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const current = itemRef.current;
        changeRef.current({ ...current, title: digest.custom_title || digest.title || current.title, digest });
        if (digest.status === 'pending' && ++attempts < 30) timer = setTimeout(poll, 2500);
        else if (digest.status === 'pending') setError('整理仍在进行，可稍后重新展开查看。原对话不受影响。');
      } catch {
        if (!controller.signal.aborted) setError('暂时无法获取摘要状态，可收起后重新展开。');
      }
    };
    timer = setTimeout(poll, 2500);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [expanded, item.id, item.digest?.status]);

  async function generate(refresh = false) {
    if (requestRef.current) return;
    requestRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true); setError('');
    try {
      const digest = await digestRequest(item.id, { generate: true, refresh, signal: controller.signal });
      if (!controller.signal.aborted) {
        const current = itemRef.current;
        onChange({ ...current, digest, title: digest.custom_title || digest.title || current.title });
      }
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '整理失败');
    } finally { requestRef.current = false; if (!controller.signal.aborted) setBusy(false); }
  }

  async function saveTitle(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || requestRef.current) return;
    requestRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true); setError('');
    try {
      const digest = await digestRequest(item.id, { title: title.trim(), signal: controller.signal });
      if (!controller.signal.aborted) {
        onChange({ ...itemRef.current, title: title.trim(), digest });
        setEditing(false);
      }
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '保存失败');
    } finally { requestRef.current = false; if (!controller.signal.aborted) setBusy(false); }
  }

  const digest = item.digest;
  const pending = busy || digest?.status === 'pending';
  const date = new Date(/Z$|[+-]\d\d:\d\d$/.test(item.updated_at) ? item.updated_at : `${item.updated_at}Z`);
  return (
    <article className={styles.record}>
      <div className={styles.meta}>
        <span>{type === 'bazi' ? '八字' : '六爻'}{digest?.topic ? ` · ${TOPICS[digest.topic] || '其他'}` : ''}</span>
        <time dateTime={item.updated_at}>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('zh-CN')}</time>
      </div>
      {editing ? (
        <form onSubmit={saveTitle} className={styles.rename}>
          <label className="sr-only" htmlFor={`title-${item.id}`}>记录标题</label>
          <input id={`title-${item.id}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} autoFocus disabled={busy} />
          <button className={styles.textButton} disabled={busy || !title.trim()}>保存</button>
          <button type="button" className={styles.textButton} onClick={() => setEditing(false)} disabled={busy}>取消</button>
        </form>
      ) : <h2>{item.title}</h2>}
      <p className={styles.preview}>{digest?.question || item.hexagram?.question || '展开查看当时的问题与解读，或直接接着聊。'}</p>
      <div className={styles.actions}>
        <button className={styles.textButton} aria-expanded={expanded} aria-controls={`digest-${item.id}`} onClick={() => {
          const opening = !expanded; setExpanded(opening); setError('');
          if (opening) {
            trackEvent('history_summary_expand', { payload: { conversation_id: item.id, type } });
            if (!digest || digest.status === 'empty') void generate();
          }
        }}><ChevronDown size={16} className={expanded ? styles.rotated : ''} aria-hidden="true" />{expanded ? '收起摘要' : '展开摘要'}</button>
        <button className={styles.continue} onClick={onContinue} disabled={disabled}>继续对话<ArrowRight size={16} aria-hidden="true" /></button>
        <details className={styles.recordMenu}>
          <summary>管理</summary>
          <div>
            <button onClick={() => { setTitle(item.title); setEditing(true); }} disabled={busy || disabled}><Pencil size={15} aria-hidden="true" />修改标题</button>
            <button onClick={onDelete} disabled={busy || disabled}><Trash2 size={15} aria-hidden="true" />删除记录</button>
          </div>
        </details>
      </div>
      {expanded && <section id={`digest-${item.id}`} className={styles.digest} aria-label="解读摘要" aria-busy={pending}>
        {digest?.summary ? <>
          <h3>当时的问题</h3><p>{digest.question}</p>
          <h3>解读要点</h3><p>{digest.summary}</p>
          <p className={styles.note}>AI 根据部分历史对话整理，仅供回顾。完整内容请查看原对话。</p>
          {digest.stale && <div className={styles.stale}><span>这之后有新的解读，可以更新摘要。</span><button onClick={() => generate(true)} disabled={pending} className={styles.textButton}><RefreshCw size={14} aria-hidden="true" />更新摘要</button></div>}
        </> : <p className={styles.note}>{pending ? '正在整理当时的问题与解读要点，你可以先继续原对话。' : '摘要暂未生成，原对话仍可正常查看。'}</p>}
        {digest?.status === 'failed' && <button className={styles.textButton} disabled={busy} onClick={() => generate(true)}>重新整理摘要</button>}
        {error && !digest?.summary && <button className={styles.textButton} disabled={busy} onClick={() => generate()}>重试</button>}
      </section>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </article>
  );
}
