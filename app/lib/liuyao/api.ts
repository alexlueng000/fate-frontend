// app/lib/liuyao/api.ts
import { api } from '../api';

export interface PaipanRequest {
  question: string;
  gender?: string;
  method: 'number' | 'coin' | 'time';
  numbers?: number[];
  timestamp?: string;
  location?: string;
  solar_time?: boolean;
}

export interface HexagramLine {
  position: number;
  is_yang: boolean;
  is_dong: boolean;
  type: string;
  dizhi?: string;
  liushou?: string;
}

export interface Hexagram {
  id: number;
  hexagram_id: string;
  question: string;
  gender: string;
  method: string;
  main_gua: string;
  change_gua: string | null;
  shi_yao: number | null;
  ying_yao: number | null;
  lines: { lines: HexagramLine[] } | null;
  ganzhi: any | null;
  created_at: string;
}

export interface HexagramDetail extends Hexagram {
  numbers: any | null;
  timestamp: string;
  location: string;
  solar_time: boolean;
  gua_type: string | null;
  jiqi: any | null;
}

// 获取认证token
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const liuyaoApi = {
  // 六爻排盘
  async paipan(data: PaipanRequest): Promise<HexagramDetail> {
    const response = await fetch(api('/liuyao/paipan'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to create paipan');
    }

    return response.json();
  },

  // 获取历史记录
  async getHistory(limit = 20, offset = 0): Promise<Hexagram[]> {
    const response = await fetch(
      api(`/liuyao/history?limit=${limit}&offset=${offset}`),
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }

    return response.json();
  },

  // 获取单个卦象详情
  async getHexagram(hexagramId: string): Promise<HexagramDetail> {
    const response = await fetch(api(`/liuyao/${hexagramId}`), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch hexagram');
    }

    return response.json();
  },

  // 删除卦象
  async deleteHexagram(hexagramId: string): Promise<{ success: boolean }> {
    const response = await fetch(api(`/liuyao/${hexagramId}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete hexagram');
    }

    return response.json();
  },

  // 获取卦象总数
  async getCount(): Promise<{ count: number }> {
    const response = await fetch(api('/liuyao/stats/count'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch count');
    }

    return response.json();
  },

  // AI解卦（流式）
  async interpretHexagram(
    hexagramId: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    const response = await fetch(api(`/liuyao/${hexagramId}/interpret`), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to start interpretation');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;

          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Stream error');
    }
  }
};
