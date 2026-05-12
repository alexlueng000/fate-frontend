import { QUICK_BUTTONS } from '@/app/lib/chat/types';

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
export const api = (path: string) => (API_BASE ? `${API_BASE}${path}` : `/api${path}`);

export type QuickButton = { label: string; prompt: string };

export async function fetchQuickButtons(): Promise<QuickButton[]> {
  try {
    const resp = await fetch(api('/config/quick_buttons'), {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!resp.ok) throw new Error('Failed to load quick buttons');

    const data: unknown = await resp.json();
    if (!Array.isArray(data)) return QUICK_BUTTONS;

    const buttons = data.filter((item): item is QuickButton => (
      typeof item === 'object' &&
      item !== null &&
      typeof item.label === 'string' &&
      item.label.trim().length > 0 &&
      typeof item.prompt === 'string' &&
      item.prompt.trim().length > 0
    ));

    return buttons.length > 0 ? buttons : QUICK_BUTTONS;
  } catch {
    return QUICK_BUTTONS;
  }
}

/** 统一提取回复文本 */
export function pickReply(d: unknown): string {
  if (!d || typeof d !== 'object') return '';
  const obj = d as Record<string, unknown>;
  if (typeof obj.reply === 'string') return obj.reply;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.content === 'string') return obj.content;
  const data = obj.data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.reply === 'string') return record.reply;
  }
  return '';
}
