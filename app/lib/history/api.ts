// app/lib/history/api.ts
import { api } from '@/app/lib/api';
import type { HexagramDetail } from '@/app/lib/liuyao/api';
import type { CareerTaskContext } from '@/app/lib/tasks/career';
import type { RelationshipTaskContext } from '@/app/lib/tasks/relationship';

export type TaskContext = CareerTaskContext | RelationshipTaskContext;

export type HistoryType = 'bazi' | 'liuyao';
export type HistoryClearType = HistoryType | 'all';
export type ConversationDigest = {
  title: string | null;
  custom_title: string | null;
  topic: string | null;
  question: string | null;
  summary: string | null;
  status: 'empty' | 'pending' | 'ready' | 'failed';
  generated_at: string | null;
  source_message_id: number;
  stale: boolean;
};

export type HexagramSummary = {
  hexagram_id: string;
  main_gua: string | null;
  change_gua: string | null;
  question: string;
};

export type ConversationListItem = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_user_message: string | null;
  last_assistant_preview: string | null;
  bazi_summary?: string | null;
  hexagram?: HexagramSummary | null;
  task_context?: TaskContext | null;
  digest?: ConversationDigest | null;
};

export type ConversationListResp = {
  items: ConversationListItem[];
  total: number;
  has_more: boolean;
};

export type MessageItem = {
  id: number;
  role: string;
  content: string;
  created_at: string;
};

export type ConversationDetailResp = {
  id: number;
  type: 'bazi' | 'liuyao';
  title: string;
  created_at: string;
  updated_at: string;
  messages: MessageItem[];
  profile?: { bazi_chart: Record<string, unknown> } | null;
  profile_changed?: boolean;
  hexagram?: HexagramDetail | null;
  task_context?: TaskContext | null;
};

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const historyApi = {
  async list(
    type: HistoryType,
    offset = 0,
    limit = 20,
    query = '',
    signal?: AbortSignal,
  ): Promise<ConversationListResp> {
    const url = api(`/conversations?type=${type}&offset=${offset}&limit=${limit}&q=${encodeURIComponent(query)}`);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include',
      signal,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to fetch conversations');
    }
    return response.json();
  },

  async detail(id: number): Promise<ConversationDetailResp> {
    const url = api(`/conversations/${id}`);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to fetch conversation');
    }
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const url = api(`/conversations/${id}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to delete conversation');
    }
  },

  async clear(type: HistoryClearType): Promise<{ deleted: number }> {
    const url = api(`/conversations?type=${type}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to clear conversations');
    }
    return response.json();
  },
};

export function hasDisplayableConversationContent(item: ConversationListItem): boolean {
  const preview = item.last_assistant_preview?.trim();
  if (!preview) return false;

  const emptyMarkers = [
    '（后端未返回解读内容）',
    '后端未返回解读内容',
    '暂无解读内容',
  ];

  return !emptyMarkers.some((marker) => preview.includes(marker));
}

export async function digestRequest(id: number, options: { generate?: boolean; refresh?: boolean; title?: string; signal?: AbortSignal } = {}): Promise<ConversationDigest> {
  const renaming = options.title !== undefined;
  const response = await fetch(api(`/conversations/${id}/${renaming ? 'title' : 'digest'}`), {
    method: renaming ? 'PATCH' : options.generate ? 'POST' : 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include', signal: options.signal,
    body: renaming ? JSON.stringify({ title: options.title }) : options.generate ? JSON.stringify({ refresh: options.refresh ?? false }) : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.detail === 'string' ? body.detail : '暂时无法整理记录，请稍后重试');
  }
  return response.json();
}
