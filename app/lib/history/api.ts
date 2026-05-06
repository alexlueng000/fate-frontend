// app/lib/history/api.ts
import { api } from '@/app/lib/api';

export type HistoryType = 'bazi' | 'liuyao';

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
  profile?: { bazi_chart: any } | null;
  profile_changed?: boolean;
  hexagram?: any | null;
};

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const historyApi = {
  async list(
    type: HistoryType,
    offset = 0,
    limit = 20
  ): Promise<ConversationListResp> {
    const url = api(`/conversations?type=${type}&offset=${offset}&limit=${limit}`);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include',
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
};
