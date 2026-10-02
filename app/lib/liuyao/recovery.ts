import type { Msg } from '@/app/lib/chat/types';
import type { ConversationTurn } from '@/app/lib/chat/turns';

export type PendingQuestion = { prompt: string; submittedPrompt?: string; display: string; baselineMessageId: number;
  requestKey?: string; retryable?: boolean; quickLabel?: string };
const key = (owner: string | number, cid: string) => `liuyao:pending:${owner}:${cid}`;

export function readPendingQuestion(owner: string | number | undefined, cid: string): PendingQuestion | null {
  if (owner === undefined) return null;
  try {
    const raw = sessionStorage.getItem(key(owner, cid));
    if (!raw) return null;
    const value = JSON.parse(raw);
    return typeof value.prompt === 'string' && value.prompt.length <= 4000
      && (value.requestKey === undefined || (typeof value.requestKey === 'string' && /^[a-f0-9]{32}$/.test(value.requestKey)))
      && (value.retryable === undefined || typeof value.retryable === 'boolean')
      && (value.quickLabel === undefined || (typeof value.quickLabel === 'string' && value.quickLabel.length <= 64))
      && (value.submittedPrompt === undefined || (typeof value.submittedPrompt === 'string' && value.submittedPrompt.length <= 4000)) && typeof value.display === 'string'
      && value.display.length <= 4000 && Number.isInteger(value.baselineMessageId) && value.baselineMessageId >= 0 ? value : null;
  } catch { return null; }
}

export function savePendingQuestion(owner: string | number | undefined, cid: string, draft: PendingQuestion | null) {
  if (owner === undefined) return;
  try {
    if (draft) sessionStorage.setItem(key(owner, cid), JSON.stringify(draft));
    else sessionStorage.removeItem(key(owner, cid));
  } catch { /* In-memory draft remains available when storage is unavailable. */ }
}

export function questionFromRemote(remote: ConversationTurn): PendingQuestion | null {
  const payload = remote.request_payload;
  if (!payload) return null;
  const quick = typeof payload.label === 'string' && typeof payload.prompt === 'string';
  const prompt = quick ? payload.prompt : payload.message;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) return null;
  const display = quick ? payload.label as string : prompt;
  if (display.length > (quick ? 64 : 4000)) return null;
  return { prompt, submittedPrompt: prompt, display, baselineMessageId: remote.baseline_message_id,
    requestKey: remote.request_key, retryable: remote.state === 'retryable', ...(quick ? { quickLabel: display } : {}) };
}

/** Only IDs from saved messages can prove that this attempted question completed. */
export function hasSavedReply(messages: Msg[], draft: PendingQuestion): boolean {
  if (!draft.baselineMessageId) return false;
  const index = messages.findIndex(message => message.role === 'user' && message.content === draft.display
    && (message.meta?.messageId ?? 0) > draft.baselineMessageId);
  return index >= 0 && messages[index + 1]?.role === 'assistant' && !!messages[index + 1].content.trim()
    && (messages[index + 1].meta?.messageId ?? 0) > draft.baselineMessageId;
}
