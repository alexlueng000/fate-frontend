'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { api } from '@/app/lib/api';
import { historyApi, type ConversationDetailResp, type TaskContext } from '@/app/lib/history/api';
import { parseSuggestedQuestions, restoreStoredMessage } from './parser';
import { normalizeMarkdown, type Msg } from './types';
import { trySSE } from './sse';
import { newTurnKey, savedTurnStatus } from './turns';

type Draft = { requestKey: string; prompt: string; originalPrompt: string; submittedPrompt: string; display: string;
  taskContext: TaskContext | null; retryable: boolean };
const key = (owner: number, cid: string) => `bazi:pending:${owner}:${cid}`;

function readDraft(owner: number, cid: string): Draft | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(owner, cid)) || 'null');
    if (!value || typeof value.requestKey !== 'string' || !/^[a-f0-9]{32}$/.test(value.requestKey) || typeof value.retryable !== 'boolean') return null;
    if (![value.prompt, value.originalPrompt, value.submittedPrompt, value.display].every(text => typeof text === 'string' && text.length <= 16000)) return null;
    if (value.taskContext !== null && typeof value.taskContext !== 'object') return null;
    return value;
  } catch { return null; }
}

function storeDraft(owner: number, cid: string, draft: Draft | null) {
  try {
    if (draft) sessionStorage.setItem(key(owner, cid), JSON.stringify(draft));
    else sessionStorage.removeItem(key(owner, cid));
  } catch { /* The in-memory draft remains available. */ }
}

function id(raw: string) { return Number(raw.replace(/^(bazi_conv_|conv_)/, '')); }
function sameConversation(left: string, right: string) {
  if (left === right) return true;
  const numeric = id(left);
  return Number.isSafeInteger(numeric) && numeric > 0 && numeric === id(right);
}

export function useSavedBaziTurn({ owner, cid, setMessages, setInput, taskContext, onRestored }: {
  owner?: number; cid: string | null; setMessages: Dispatch<SetStateAction<Msg[]>>;
  setInput: Dispatch<SetStateAction<string>>; taskContext: TaskContext | null;
  onRestored: (detail: ConversationDetailResp) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const restoredCallback = useRef(onRestored);
  useEffect(() => { restoredCallback.current = onRestored; }, [onRestored]);

  useEffect(() => {
    const version = ++generation.current;
    controller.current?.abort();
    lock.current = false;
    setBusy(false); setNotice(null);
    const saved = owner && cid ? readDraft(owner, cid) : null;
    draftRef.current = saved; setDraft(saved);
    setError(saved && !saved.retryable ? '上次回复的保存状态尚未确认，问题草稿已保留。' : null);
    if (saved) setInput(saved.prompt);
    if (saved) setMessages(messages => messages.filter(message => message.meta?.kind !== `turn:${saved.requestKey}`));
    return () => { generation.current = version + 1; controller.current?.abort(); };
  }, [owner, cid, setInput, setMessages]);

  const update = (value: Draft | null) => {
    draftRef.current = value; setDraft(value);
    if (owner && cid) storeDraft(owner, cid, value);
  };

  const onInputChange = (value: string) => {
    setInput(value);
    if (draftRef.current) update({ ...draftRef.current, prompt: value });
  };

  const run = async (content: string, displayMessage?: string) => {
    if (!owner || !cid) throw new Error('请登录并重新加载会话后再试。');
    if (lock.current || (draftRef.current && !draftRef.current.retryable)) return;
    lock.current = true; setBusy(true); setNotice(null); setError(null);
    const version = generation.current;
    const previous = draftRef.current;
    // A manual retry preserves the original hidden prompt/display/facts. An
    // edited question gets a fresh key only after the old attempt is retryable.
    const retry = previous?.retryable && previous.prompt === previous.originalPrompt && content === previous.originalPrompt;
    const editablePrompt = taskContext && displayMessage === taskContext.title
      ? (taskContext.taskType === 'career' ? taskContext.facts?.topic : undefined) || displayMessage : content;
    const attempt: Draft = retry ? { ...previous, retryable: false } : { requestKey: newTurnKey(), prompt: editablePrompt,
      originalPrompt: editablePrompt, submittedPrompt: content, display: displayMessage || content, taskContext, retryable: false };
    update(attempt); // Persist before the network request, including page-close cases.
    const marker = `turn:${attempt.requestKey}`;
    const current = () => version === generation.current;
    setMessages(messages => [...messages, { role: 'user', content: attempt.display, meta: { kind: marker } },
      { role: 'assistant', content: '', streaming: true, meta: { kind: marker } }]);
    controller.current = new AbortController();
    let mismatchedConversation = false;
    try {
      await trySSE(api('/chat'), { conversation_id: cid, request_key: attempt.requestKey,
        message: attempt.submittedPrompt, display_message: attempt.display, task_context: attempt.taskContext },
        text => { if (current()) setMessages(messages => messages.map(message => message.role === 'assistant' && message.meta?.kind === marker ? { ...message, content: text } : message)); },
        meta => {
          if (!current() || typeof meta !== 'object' || !meta) return;
          const value = meta as { message_id?: number; conversation_id?: string };
          if (value.conversation_id && !sameConversation(value.conversation_id, cid)) mismatchedConversation = true;
          if (value.message_id) setMessages(messages => messages.map(message => message.role === 'assistant' && message.meta?.kind === marker
            ? { ...message, meta: { ...message.meta, messageId: value.message_id } } : message));
        }, { mobilePacing: true, signal: controller.current.signal });
      if (!current()) return;
      if (mismatchedConversation) throw new Error('回复与当前会话不一致，请重新加载。');
      setMessages(messages => messages.map(message => {
        if (message.meta?.kind !== marker) return message;
        if (message.role === 'user') return { ...message, meta: undefined };
        const parsed = parseSuggestedQuestions(message.content);
        return { ...message, streaming: false, content: normalizeMarkdown(parsed.cleanedContent), suggestedQuestions: parsed.questions,
          meta: message.meta?.messageId ? { messageId: message.meta.messageId } : undefined };
      }));
      update(null);
    } catch (failure) {
      if (!current()) return;
      setMessages(messages => messages.filter(message => message.meta?.kind !== marker));
      const saved = draftRef.current || attempt;
      setInput(saved.prompt);
      setError('这次回复未能确认完成。请先重新加载保存记录，问题草稿已保留。');
      throw failure;
    } finally {
      if (current()) { lock.current = false; setBusy(false); controller.current = null; }
    }
  };

  const recover = async () => {
    const pending = draftRef.current;
    if (!owner || !cid || !pending || lock.current) return;
    lock.current = true; setBusy(true);
    const version = generation.current;
    const current = () => version === generation.current;
    try {
      const status = await savedTurnStatus(pending.requestKey);
      if (!current()) return;
      if (status.conversation_id && !sameConversation(status.conversation_id, cid)) throw new Error('请求与当前会话不一致，请重新打开原记录。');
      if (status.state === 'pending') { setError('这个问题仍在生成，请稍后重新加载。原解读与草稿已保留。'); return; }
      const detail = await historyApi.detail(id(cid));
      if (!current()) return;
      if (detail.type !== 'bazi' || detail.id !== id(cid)) throw new Error('保存记录与当前会话不一致。');
      const restored = detail.messages.filter((message, index) => (message.role === 'user' || message.role === 'assistant')
        && !(index === 0 && message.role === 'user' && message.content.startsWith('我的命盘信息如下'))).map(restoreStoredMessage);
      if (status.state === 'succeeded' && !restored.some(message => message.role === 'assistant' && message.meta?.messageId === status.message_id)) {
        throw new Error('请求已保存，但当前记录尚未包含该回复，请稍后重新加载。');
      }
      setMessages(messages => restored.length ? restored : messages.filter(message => message.meta?.kind === 'intro'));
      restoredCallback.current(detail);
      const edited = draftRef.current || pending;
      if (status.state === 'succeeded') {
        update(null);
        setInput(edited.prompt === edited.originalPrompt ? '' : edited.prompt);
        setNotice('已读取到这次问题的保存结果，无需重复发送。');
      } else {
        update({ ...edited, retryable: true }); setInput(edited.prompt);
        setNotice('已更新保存记录，问题草稿已保留，可以核对后重试。');
      }
      setError(null);
    } catch (failure) {
      if (current()) setError(failure instanceof Error ? failure.message : '暂时无法查询，原解读与草稿已保留。');
    } finally { if (current()) { lock.current = false; setBusy(false); } }
  };

  return { run, recover, onInputChange, stop: () => controller.current?.abort(),
    blocked: !!draft && !draft.retryable, busy, error, notice, hasDraft: !!draft };
}
