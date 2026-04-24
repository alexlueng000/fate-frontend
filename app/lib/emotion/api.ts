// app/lib/emotion/api.ts
import { api } from '../api';

export interface EmotionRecord {
  id: number;
  user_id: number;
  record_date: string;
  solar_term: string | null;
  wuxing_element: string | null;
  emotion_score: number;
  emotion_tags: string[] | null;
  content: string;
  ai_response: string | null;
  created_at: string;
}

export interface CreateEmotionRecordRequest {
  emotion_score: number;
  emotion_tags?: string[];
  content: string;
}

export interface WeeklyChart {
  dates: string[];
  scores: (number | null)[];
  average_score: number;
}

export interface CharacterProfile {
  element: string;
  positive_traits: string[];
  negative_traits: string[];
  emotion_tendency: string;
  advice: string;
  wuxing_balance: {
    wuxing_count: Record<string, number>;
    strongest: string;
    weakest: string;
    balance_score: number;
  };
}

export interface ExceptionMoment {
  id: number;
  user_id: number;
  title: string;
  content: string;
  moment_date: string;
  created_at: string;
}

export interface CreateExceptionMomentRequest {
  title: string;
  content: string;
  moment_date: string;
}

export interface ValueAction {
  id: number;
  user_id: number;
  value_name: string;
  action_plan: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CreateValueActionRequest {
  value_name: string;
  action_plan: string;
}

// 获取认证token
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const emotionApi = {
  // 创建情绪记录
  async createRecord(data: CreateEmotionRecordRequest): Promise<EmotionRecord> {
    const response = await fetch(api('/emotion/records'), {
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
      throw new Error(error.detail || 'Failed to create emotion record');
    }

    return response.json();
  },

  // 获取情绪记录列表
  async getRecords(limit = 30, offset = 0): Promise<EmotionRecord[]> {
    const response = await fetch(
      api(`/emotion/records?limit=${limit}&offset=${offset}`),
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch emotion records');
    }

    return response.json();
  },

  // 获取单条情绪记录
  async getRecord(recordId: number): Promise<EmotionRecord> {
    const response = await fetch(api(`/emotion/records/${recordId}`), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch emotion record');
    }

    return response.json();
  },

  // 获取一周情绪图表
  async getWeeklyChart(): Promise<WeeklyChart> {
    const response = await fetch(api('/emotion/weekly-chart'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch weekly chart');
    }

    return response.json();
  },

  // 获取性格档案
  async getCharacterProfile(): Promise<CharacterProfile> {
    const response = await fetch(api('/emotion/character-profile'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to fetch character profile');
    }

    return response.json();
  },

  // 创建例外时刻
  async createExceptionMoment(data: CreateExceptionMomentRequest): Promise<ExceptionMoment> {
    const response = await fetch(api('/emotion/exception-moments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create exception moment');
    }

    return response.json();
  },

  // 获取例外时刻列表
  async getExceptionMoments(limit = 20, offset = 0): Promise<ExceptionMoment[]> {
    const response = await fetch(
      api(`/emotion/exception-moments?limit=${limit}&offset=${offset}`),
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exception moments');
    }

    return response.json();
  },

  // 创建价值行动
  async createValueAction(data: CreateValueActionRequest): Promise<ValueAction> {
    const response = await fetch(api('/emotion/value-actions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create value action');
    }

    return response.json();
  },

  // 获取价值行动列表
  async getValueActions(status?: number, limit = 20, offset = 0): Promise<ValueAction[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status !== undefined) {
      params.append('status', String(status));
    }

    const response = await fetch(api(`/emotion/value-actions?${params}`), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch value actions');
    }

    return response.json();
  },

  // 更新价值行动状态
  async updateValueActionStatus(actionId: number, status: number): Promise<{ success: boolean }> {
    const response = await fetch(
      api(`/emotion/value-actions/${actionId}/status?status=${status}`),
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update value action status');
    }

    return response.json();
  }
};

