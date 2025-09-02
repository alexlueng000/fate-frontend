const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
export const api = (path: string) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`);

/** 统一提取回复文本 */
export function pickReply(d: unknown): string {
  if (!d || typeof d !== 'object') return '';
  const obj = d as Record<string, unknown>;
  if (typeof obj.reply === 'string') return obj.reply;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.content === 'string') return obj.content;
  if (obj.data && typeof (obj.data as any).reply === 'string') return (obj.data as any).reply;
  return '';
}
