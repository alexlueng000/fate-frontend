import { api } from '@/app/lib/api';

export type SavedTurnStatus = { state: 'pending' | 'retryable' | 'succeeded'; conversation_id?: string; reply?: string; message_id?: number };
export type ConversationTurn = SavedTurnStatus & { request_key: string; kind: 'bazi' | 'liuyao';
  request_payload: Record<string, unknown> | null; baseline_message_id: number };

export function newTurnKey(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

/** This only reads state. A retry must reuse the original request key. */
export async function savedTurnStatus(requestKey: string): Promise<SavedTurnStatus> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(api(`/chat/requests/${requestKey}`), { credentials: 'include', cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {} });
  // A delayed request may not have reserved yet; the same key still protects
  // a manual retry racing that delayed request.
  if (response.status === 404) return { state: 'retryable' };
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || '暂时无法查询请求状态，请稍后重试。');
  if (!['pending', 'retryable', 'succeeded'].includes(data.state)) throw new Error('请求状态无法确认，请稍后重试。');
  if (data.state === 'succeeded' && (!Number.isSafeInteger(data.message_id) || typeof data.reply !== 'string' || !data.reply.trim())) {
    throw new Error('已保存的请求内容无法确认，请稍后重试。');
  }
  return data;
}

export async function conversationTurn(cid: string, kind: 'bazi' | 'liuyao'): Promise<ConversationTurn | null> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(api(`/chat/conversations/${encodeURIComponent(cid)}/request`), {
    credentials: 'include', cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || '暂时无法检查会话请求，请重新加载后继续。');
  const numeric = (value: string) => value.replace(/^(bazi_conv_|liuyao_conv_|conv_)/, '');
  if (typeof data.conversation_id !== 'string' || numeric(data.conversation_id) !== numeric(cid)) throw new Error('请求与当前会话不一致，请重新打开原记录。');
  if (data.state === 'idle') return null;
  if (!['pending', 'retryable', 'succeeded'].includes(data.state) || data.kind !== kind
    || typeof data.request_key !== 'string' || !/^[a-f0-9]{32}$/.test(data.request_key)
    || !Number.isSafeInteger(data.baseline_message_id) || data.baseline_message_id < 0
    || (data.request_payload !== null && (typeof data.request_payload !== 'object' || Array.isArray(data.request_payload)))) {
    throw new Error('会话请求记录无法确认，请稍后重新加载。');
  }
  return data;
}
