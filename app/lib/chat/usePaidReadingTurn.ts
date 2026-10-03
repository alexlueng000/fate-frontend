'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { api, authHeaders } from '@/app/lib/api';
import { historyApi, type ConversationDetailResp } from '@/app/lib/history/api';
import { restoreStoredMessage } from './parser';
import type { Msg } from './types';
import { trySSE } from './sse';

type Pending = { key: string; passId: number; original: string; question: string; retry: 'none' | 'same' | 'new' };
type RequestState = { status: 'PENDING' | 'EXPIRED' | 'FAILED' | 'SUCCEEDED'; conversation_id: number;
  request_key: string; pass_id: number; message: string; message_id: number | null; reply: string | null; baseline_message_id: number | null };
const storageKey = (owner: number, cid: number) => `reading:pending:${owner}:${cid}`;

function read(owner: number, cid: number): Pending | null {
  try {
    const pending = JSON.parse(sessionStorage.getItem(storageKey(owner, cid)) || 'null');
    if (!pending || !/^[a-zA-Z0-9_-]{8,64}$/.test(pending.key) || !Number.isSafeInteger(pending.passId) || pending.passId < 1
      || !['none', 'same', 'new'].includes(pending.retry)
      || ![pending.original, pending.question].every(text => typeof text === 'string' && text.length <= 4000)) return null;
    return pending;
  } catch { return null; }
}

async function requestState(cid: number, key?: string): Promise<RequestState | null> {
  const response = await fetch(api(`/consultations/${cid}/${key ? `requests/${encodeURIComponent(key)}` : 'request'}`),
    { credentials: 'include', cache: 'no-store', headers: authHeaders() });
  if (key && response.status === 404) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('暂时无法确认解读保存状态，请重新加载后继续。');
  if (data.conversation_id !== cid) throw new Error('请求与当前问题不一致，请重新打开原记录。');
  if (!key && data.status === 'IDLE') return null;
  if (!['PENDING', 'EXPIRED', 'FAILED', 'SUCCEEDED'].includes(data.status)
    || typeof data.request_key !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(data.request_key)
    || (key && data.request_key !== key) || !Number.isSafeInteger(data.pass_id) || data.pass_id < 1
    || typeof data.message !== 'string' || !data.message.trim() || data.message.length > 4000
    || (data.status === 'SUCCEEDED' && (typeof data.reply !== 'string' || !data.reply.trim()))
    || (data.baseline_message_id !== null && (!Number.isSafeInteger(data.baseline_message_id) || data.baseline_message_id < 0))
    || (data.message_id !== null && (!Number.isSafeInteger(data.message_id) || data.message_id < 1))) {
    throw new Error('解读保存记录无法确认，请查看原对话。');
  }
  return data;
}

/** Paid retries follow their own API: failed keys require a new key, unknown
 * or missing requests retain the original key. Reads never call the model.
 */
export function usePaidReadingTurn({ owner, cid, input, setInput, setMessages, onRestored, onSettled }: {
  owner?: number; cid: number; input: string; setInput: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<Msg[]>>; onRestored: (detail: ConversationDetailResp) => void;
  onSettled: () => Promise<void>;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [remote, setRemote] = useState<RequestState | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const callbacks = useRef({ onRestored, onSettled });
  useEffect(() => { callbacks.current = { onRestored, onSettled }; }, [onRestored, onSettled]);
  const update = useCallback((value: Pending | null) => {
    pendingRef.current = value; setPending(value);
    if (!owner) return;
    try {
      if (value) sessionStorage.setItem(storageKey(owner, cid), JSON.stringify(value));
      else sessionStorage.removeItem(storageKey(owner, cid));
    } catch { /* Retain the in-memory attempt if browser storage is unavailable. */ }
  }, [owner, cid]);
  useEffect(() => {
    const version = ++generation.current;
    controller.current?.abort(); lock.current = false; setBusy(false); setSending(false); setRemote(null); setNotice(null);
    const saved = owner ? read(owner, cid) : null;
    pendingRef.current = saved; setPending(saved); setChecking(true);
    setError(saved?.retry === 'none' ? '上次解读的保存结果尚未确认，问题草稿已保留。' : null);
    setInput(saved?.question || '');
    if (owner && Number.isSafeInteger(cid) && cid > 0) {
      void requestState(cid).then(result => {
        if (generation.current !== version) return;
        setRemote(result);
        if (result && !pendingRef.current) {
          const adopted: Pending = { key: result.request_key, passId: result.pass_id, original: result.message, question: result.message,
            retry: result.status === 'PENDING' ? 'none' : 'new' };
          update(adopted); setInput(adopted.question);
          if (adopted.retry !== 'none') setNotice('已恢复未完成的问题，可以核对后手动重试。');
        }
        if (result?.status === 'PENDING') setError('当前问题仍有解读在生成，请先检查保存结果。');
      }).catch(() => { if (generation.current === version) setError('暂时无法检查解读保存状态，请重新加载后继续。'); })
        .finally(() => { if (generation.current === version) setChecking(false); });
    }
    return () => { generation.current = version + 1; controller.current?.abort(); };
  }, [owner, cid, update, setInput]);

  const onInputChange = (value: string) => {
    setInput(value);
    if (pendingRef.current) update({ ...pendingRef.current, question: value });
  };
  const restored = async (result: RequestState | null, version: number) => {
    const detail = await historyApi.detail(cid);
    if (generation.current !== version) return false;
    if (detail.id !== cid) throw new Error('保存记录与当前问题不一致。');
    if (result?.status === 'SUCCEEDED' && result.message_id !== null
      && !detail.messages.some(message => message.id === result.message_id && message.role === 'assistant' && message.content === result.reply)) {
      throw new Error('请求已完成，但当前记录尚未包含对应回复，请稍后重新加载。');
    }
    setMessages(detail.messages.filter(m => m.role === 'user' || m.role === 'assistant').map(restoreStoredMessage));
    callbacks.current.onRestored(detail);
    return true;
  };
  const recover = async () => {
    if (!owner || lock.current) return;
    lock.current = true; setBusy(true);
    const version = generation.current;
    try {
      const current = await requestState(cid);
      if (generation.current !== version) return;
      setRemote(current);
      let saved = pendingRef.current;
      if (current?.status === 'PENDING' && (!saved || current.request_key !== saved.key)) {
        setError('另一个页面的解读仍在生成，当前草稿已保留，请稍后重新加载。'); return;
      }
      if (!saved && current) {
        saved = { key: current.request_key, passId: current.pass_id, original: current.message, question: input || current.message, retry: 'none' };
        update(saved);
      }
      const result = saved ? await requestState(cid, saved.key) : null;
      if (generation.current !== version) return;
      if (result && saved && (result.pass_id !== saved.passId || result.message !== saved.original)) throw new Error('请求内容与原草稿不一致，请查看原对话。');
      if (result?.status === 'PENDING') { setError('这条解读仍在生成，请稍后重新加载，问题草稿已保留。'); return; }
      if (!await restored(result, version)) return;
      const edited = pendingRef.current || saved;
      if (result?.status === 'SUCCEEDED') {
        update(null); setRemote(null); setInput(edited && edited.question !== edited.original ? edited.question : '');
        setNotice(result.message_id === null ? '旧请求已标记完成，缺少回复定位；请核对原对话，不会重复发送这条问题。' : '已读取到保存结果，无需重复发送。');
      } else if (edited) {
        update({ ...edited, question: edited.question || edited.original, retry: result ? 'new' : 'same' });
        setInput(edited.question || edited.original); setNotice('已检查保存记录，可以核对问题后手动重试。');
      } else setNotice('已更新原对话与权益。');
      setError(null); setChecking(false);
      await callbacks.current.onSettled();
    } catch (failure) { if (generation.current === version) setError(failure instanceof Error ? failure.message : '保存状态暂时无法确认。'); }
    finally { if (generation.current === version) { lock.current = false; setBusy(false); } }
  };
  const run = async (question: string, passId: number) => {
    if (!owner || lock.current || checking || error || remote?.status === 'PENDING' || pendingRef.current?.retry === 'none') return;
    question = question.trim();
    if (!question || question.length > 4000) return;
    const previous = pendingRef.current;
    const reuse = previous?.retry === 'same' && previous.original === question && previous.passId === passId;
    const attempt: Pending = { key: reuse ? previous.key : crypto.randomUUID(), passId, original: question, question, retry: 'none' };
    update(attempt); setInput(''); setNotice(null); setError(null);
    lock.current = true; setBusy(true); setSending(true);
    const version = generation.current;
    const marker = `paid:${attempt.key}`;
    const current = () => generation.current === version;
    const before: Msg = { role: 'user', content: question, meta: { kind: marker } };
    setMessages(messages => [...messages, before, { role: 'assistant', content: '', streaming: true, meta: { kind: marker } }]);
    controller.current = new AbortController();
    try {
      await trySSE(api(`/consultations/${cid}/messages`), { pass_id: passId, request_key: attempt.key, message: question },
        content => { if (current()) setMessages(messages => messages.map(message => message.meta?.kind === marker && message.role === 'assistant' ? { ...message, content } : message)); },
        undefined, { signal: controller.current.signal, requireDone: true });
      if (!current()) return;
      const result = await requestState(cid, attempt.key);
      if (!current()) return;
      if (!result || result.status !== 'SUCCEEDED' || result.message !== question || result.pass_id !== passId) throw new Error('回复保存结果尚未确认，请重新加载。');
      if (!await restored(result, version)) return;
      const edited = pendingRef.current;
      update(null); setRemote(null); setInput(edited && edited.question !== edited.original ? edited.question : '');
    } catch {
      if (!current()) return;
      setMessages(messages => messages.filter(message => message.meta?.kind !== marker));
      setInput(pendingRef.current?.question || question);
      setError('这次解读未能确认完成。请先检查保存结果，原解读与问题草稿已保留。');
    } finally {
      if (current()) {
        lock.current = false; setBusy(false); setSending(false); controller.current = null;
        await callbacks.current.onSettled().catch(() => {});
      }
    }
  };
  return { run, recover, onInputChange, stop: () => controller.current?.abort(), sending, busy: busy || checking,
    blocked: !!error || remote?.status === 'PENDING' || pending?.retry === 'none', error, notice,
    hasDraft: !!pending || !!error };
}
