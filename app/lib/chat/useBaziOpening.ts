'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { historyApi, type ConversationDetailResp, type TaskContext } from '@/app/lib/history/api';
import { trySSE, QuotaExhaustedError } from './sse';
import type { Msg, Paipan } from './types';

type Target = { body?: { guest_analysis_public_id?: string }; cid?: string };
type Status = { state: 'idle' | 'pending' | 'retryable' | 'succeeded'; conversation_id?: string;
  source_hash?: string; message_id?: number; reply?: string; paipan?: Paipan; task_context?: TaskContext | null };
type Phase = 'off' | 'checking' | 'pending' | 'retryable' | 'unknown' | 'generating' | 'complete';
const numericId = (cid: string) => Number(cid.replace(/^(bazi_conv_|conv_)/, ''));

/** An opening has a server-owned source. Recovery only reads; retries are manual. */
export function useBaziOpening({ owner, onSource, onMessages, onSaved, onQuotaExhausted }: {
  owner?: number; onSource: (status: Status) => void;
  onMessages: (messages: Msg[]) => void; onSaved: (detail: ConversationDetailResp) => void;
  onQuotaExhausted: (detail: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>('off');
  const [error, setError] = useState<string | null>(null);
  const callbacks = useRef({ onSource, onMessages, onSaved, onQuotaExhausted });
  callbacks.current = { onSource, onMessages, onSaved, onQuotaExhausted };
  const target = useRef<Target | null>(null);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    const cancel = () => { sequence.current++; controller.current?.abort(); };
    cancel(); locked.current = false;
    target.current = null; setPhase('off'); setError(null);
    return cancel;
  }, [owner]);

  const read = useCallback(async (selected: Target, signal: AbortSignal): Promise<Status> => {
    const token = getAuthToken();
    if (!owner || !token) throw new Error('请登录后重新打开解读记录。');
    const url = selected.cid ? `/chat/conversations/${encodeURIComponent(selected.cid)}/opening` : '/chat/start/status';
    const response = await fetch(api(url), { method: selected.cid ? 'GET' : 'POST', cache: 'no-store',
      credentials: 'include', signal, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(selected.cid ? {} : { body: JSON.stringify(selected.body || {}) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || '暂时无法检查首次解读，请稍后重新加载。');
    if (!['idle', 'pending', 'retryable', 'succeeded'].includes(data.state)) throw new Error('首次解读状态无法确认，请稍后重新加载。');
    if (data.state !== 'idle' && (typeof data.conversation_id !== 'string' || !/^bazi_conv_[1-9]\d*$/.test(data.conversation_id))) {
      throw new Error('首次解读记录无法确认，请从解读记录重新打开。');
    }
    if (selected.cid && data.conversation_id && numericId(data.conversation_id) !== numericId(selected.cid)) throw new Error('解读与当前会话不一致。');
    if (data.state === 'idle' && !selected.cid && !/^[a-f0-9]{64}$/.test(data.source_hash || '')) throw new Error('本次命盘来源无法确认，请重新加载。');
    if (data.state === 'succeeded' && (!Number.isSafeInteger(data.message_id) || data.message_id < 1 || typeof data.reply !== 'string' || !data.reply.trim())) {
      throw new Error('已保存的首次解读无法确认，请重新加载。');
    }
    return data;
  }, [owner]);

  const restore = useCallback(async (status: Status, version: number) => {
    const detail = await historyApi.detail(numericId(status.conversation_id!));
    if (version !== sequence.current) return;
    if (detail.type !== 'bazi' || detail.id !== numericId(status.conversation_id!)
      || !detail.messages.some(message => message.id === status.message_id && message.role === 'assistant' && message.content === status.reply)) {
      throw new Error('原报告的保存记录尚未确认，请重新加载。');
    }
    callbacks.current.onSource(status);
    callbacks.current.onSaved(detail);
    setPhase('complete'); setError(null);
  }, []);

  const generate = useCallback(async (selected: Target, version: number, signal: AbortSignal) => {
    setPhase('generating'); setError(null);
    callbacks.current.onMessages([{ role: 'assistant', content: '', streaming: true }]);
    await trySSE(api(selected.cid ? `/chat/conversations/${encodeURIComponent(selected.cid)}/opening` : '/chat/start'),
      selected.cid ? {} : selected.body || {},
      text => { if (version === sequence.current) callbacks.current.onMessages([{ role: 'assistant', content: text, streaming: true }]); },
      meta => {
        if (version !== sequence.current || !meta || typeof meta !== 'object') return;
        const cid = (meta as Record<string, unknown>).conversation_id;
        if (typeof cid === 'string' && /^bazi_conv_[1-9]\d*$/.test(cid)) {
          target.current = { ...selected, cid };
          callbacks.current.onSource({ state: 'pending', conversation_id: cid });
        }
      }, { signal },
    );
    if (version !== sequence.current) return;
    // Even a completed stream is shown as saved only after the owned DB reply
    // and exact message number agree. Streaming snapshots are never archives.
    const status = await read(target.current || selected, signal);
    if (status.state !== 'succeeded') throw new Error('解读的保存状态尚未确认，请重新加载。');
    await restore(status, version);
  }, [read, restore]);

  const inspect = useCallback(async (selected: Target, autoStart: boolean) => {
    if (locked.current) return;
    locked.current = true;
    const version = ++sequence.current;
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    target.current = selected; setPhase('checking'); setError(null);
    try {
      const status = await read(selected, abort.signal);
      if (version !== sequence.current) return;
      callbacks.current.onSource(status);
      if (status.conversation_id && status.state !== 'idle') target.current = { ...selected, cid: status.conversation_id };
      if (status.state === 'succeeded') { await restore(status, version); return; }
      if (status.state === 'idle' && selected.cid) { setPhase('off'); return; }
      if (status.state === 'pending') { setPhase('pending'); return; }
      if (status.state === 'retryable') { setPhase('retryable'); return; }
      const marker = `bazi:opening:${owner}:${status.source_hash}`;
      // Write before POST, including a dropped connection before any CID. A
      // reload must not silently repeat a request whose outcome is unknown.
      let attempted = false;
      try { attempted = sessionStorage.getItem(marker) === 'attempted'; } catch { /* Server also deduplicates by source. */ }
      if (!autoStart || attempted) { setPhase('retryable'); return; }
      try { sessionStorage.setItem(marker, 'attempted'); } catch { /* Server reservation remains authoritative. */ }
      await generate(selected, version, abort.signal);
    } catch (failure) {
      if (version === sequence.current) {
        if (failure instanceof QuotaExhaustedError) callbacks.current.onQuotaExhausted(failure.detail);
        callbacks.current.onMessages([]);
        setPhase('unknown'); setError(failure instanceof Error ? failure.message : '首次解读暂未确认，请重新加载。');
      }
    } finally { if (version === sequence.current) locked.current = false; }
  }, [read, restore, generate, owner]);

  const retry = useCallback(async () => {
    if (locked.current || !target.current) return;
    locked.current = true;
    const selected = target.current;
    const version = ++sequence.current;
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    setPhase('checking'); setError(null);
    try {
      const status = await read(selected, abort.signal);
      if (version !== sequence.current) return;
      callbacks.current.onSource(status);
      if (status.state === 'succeeded') { await restore(status, version); return; }
      if (status.state === 'pending') { setPhase('pending'); return; }
      if (status.state === 'idle' && selected.cid) throw new Error('这条记录没有可重试的首次解读，请返回解读记录检查。');
      const resumed = status.conversation_id ? { ...selected, cid: status.conversation_id } : selected;
      target.current = resumed;
      if (status.source_hash) {
        try { sessionStorage.setItem(`bazi:opening:${owner}:${status.source_hash}`, 'attempted'); } catch { /* Server protects the request. */ }
      }
      await generate(resumed, version, abort.signal);
    } catch (failure) {
      if (version === sequence.current) {
        if (failure instanceof QuotaExhaustedError) callbacks.current.onQuotaExhausted(failure.detail);
        callbacks.current.onMessages([]); setPhase('unknown');
        setError(failure instanceof Error ? failure.message : '本次报告暂未完成，请重新加载。');
      }
    } finally { if (version === sequence.current) locked.current = false; }
  }, [read, restore, generate, owner]);

  const reload = useCallback(() => target.current ? inspect(target.current, false) : Promise.resolve(), [inspect]);
  return { phase, error, load: inspect, reload, retry,
    blocked: phase !== 'off' && phase !== 'complete', busy: phase === 'checking' || phase === 'generating',
    stop: () => { controller.current?.abort(); },
  };
}
