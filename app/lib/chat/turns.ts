import { api } from '@/app/lib/api';

export type SavedTurnStatus = { state: 'pending' | 'retryable' | 'succeeded'; conversation_id?: string; reply?: string; message_id?: number };

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
