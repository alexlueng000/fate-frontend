import type { Msg } from '@/app/lib/chat/types';

export type PendingQuestion = { prompt: string; submittedPrompt?: string; display: string; baselineMessageId: number };
const key = (owner: string | number, cid: string) => `liuyao:pending:${owner}:${cid}`;

export function readPendingQuestion(owner: string | number | undefined, cid: string): PendingQuestion | null {
  if (owner === undefined) return null;
  try {
    const raw = sessionStorage.getItem(key(owner, cid));
    if (!raw) return null;
    const value = JSON.parse(raw);
    return typeof value.prompt === 'string' && value.prompt.length <= 4000
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

/** Only IDs from saved messages can prove that this attempted question completed. */
export function hasSavedReply(messages: Msg[], draft: PendingQuestion): boolean {
  if (!draft.baselineMessageId) return false;
  const index = messages.findIndex(message => message.role === 'user' && message.content === draft.display
    && (message.meta?.messageId ?? 0) > draft.baselineMessageId);
  return index >= 0 && messages[index + 1]?.role === 'assistant' && !!messages[index + 1].content.trim()
    && (messages[index + 1].meta?.messageId ?? 0) > draft.baselineMessageId;
}
