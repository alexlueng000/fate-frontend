// app/lib/liuyao/api.ts
import { api } from '../api';
import { trySSE } from '../chat/sse';
import type { CareerTaskContext } from '../tasks/career';
import type { RelationshipTaskContext } from '../tasks/relationship';

type LiuyaoTaskContext = CareerTaskContext | RelationshipTaskContext;

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

export interface HexagramGanzhi {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
}

export interface NumberCastResult {
  numbers?: number[];
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
  ganzhi: HexagramGanzhi | null;
  created_at: string;
}

export interface HexagramDetail extends Hexagram {
  numbers: NumberCastResult | null;
  timestamp: string;
  location: string;
  solar_time: boolean;
  gua_type: string | null;
  jiqi: {
    current?: string;
    next?: string;
    next_time?: string;
  } | null;
  gua_gong?: string;
  shang_gua?: string;
  xia_gua?: string;
  dong_yao?: number;
  jieqi?: {
    current?: string;
    next?: string;
    next_time?: string;
  } | null;
  lunar_date?: string;
  shensha?: string;
  gua_shen?: string;
  change_lines?: { lines: HexagramLine[] } | null;
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

  /**
   * 游客免登录起卦：只生成卦象，不消耗免费 AI 解卦次数。
   */
  async guestPaipan(data: PaipanRequest & { guest_session_id: string }): Promise<HexagramDetail> {
    const response = await fetch(api('/guest/liuyao/paipan'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to create guest paipan');
    }

    return response.json();
  },

  /**
   * 游客免费试用：基于同一问题与起卦参数生成首次 AI 解卦。
   * 后续追问仍需登录。
   */
  async guestStart(
    data: PaipanRequest & { guest_session_id: string },
    onChunk: (text: string) => void,
    onMeta?: (meta: unknown) => void,
  ): Promise<void> {
    return trySSE(
      api('/guest/liuyao/start'),
      data,
      onChunk,
      onMeta,
    );
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

  // ===== 多轮对话（推荐使用）=====

  /**
   * 开启六爻多轮对话（流式）。
   * 调用 POST /liuyao/{hexagramId}/chat/start，消耗 1 次 liuyao_chat 配额。
   * 通过 onMeta 回调取回 conversation_id。
   */
  async startChat(
    hexagramId: string,
    onChunk: (text: string) => void,
    onMeta?: (meta: unknown) => void,
    taskContext?: LiuyaoTaskContext | null,
  ): Promise<void> {
    return trySSE(
      api(`/liuyao/${hexagramId}/chat/start`),
      { task_context: taskContext ?? undefined },
      onChunk,
      onMeta,
    );
  },

  /**
   * 续聊：在已有 conversation_id 上发送一条消息，流式返回。
   */
  async sendChat(
    hexagramId: string,
    conversationId: string,
    message: string,
    onChunk: (text: string) => void,
    onMeta?: (meta: unknown) => void,
  ): Promise<void> {
    return trySSE(
      api(`/liuyao/${hexagramId}/chat`),
      { conversation_id: conversationId, message },
      onChunk,
      onMeta,
    );
  },

  /**
   * 快捷分析：label + prompt 由管理后台 (liuyao_quick_buttons) 配置。
   */
  async quickChat(
    hexagramId: string,
    conversationId: string,
    label: string,
    prompt: string,
    onChunk: (text: string) => void,
    onMeta?: (meta: unknown) => void,
  ): Promise<void> {
    return trySSE(
      api(`/liuyao/${hexagramId}/chat/quick`),
      { conversation_id: conversationId, label, prompt },
      onChunk,
      onMeta,
    );
  },

  /**
   * 重新生成上一条 assistant 回复（一次性，非流式）。
   */
  async regenerateChat(
    hexagramId: string,
    conversationId: string,
  ): Promise<{ conversation_id: string; reply: string }> {
    const response = await fetch(api(`/liuyao/${hexagramId}/chat/regenerate`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Failed to regenerate');
    }
    return response.json();
  },

  // AI解卦（流式）—— 旧接口，保留以便平滑过渡
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
          } catch {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Stream error');
    }
  }
};
