// app/lib/emotion/api.ts
import { apiClient } from '../api';

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

export const emotionApi = {
  // 创建情绪记录
  async createRecord(data: CreateEmotionRecordRequest): Promise<EmotionRecord> {
    const response = await apiClient.post('/emotion/records', data);
    return response.data;
  },

  // 获取情绪记录列表
  async getRecords(limit = 30, offset = 0): Promise<EmotionRecord[]> {
    const response = await apiClient.get('/emotion/records', {
      params: { limit, offset }
    });
    return response.data;
  },

  // 获取单条情绪记录
  async getRecord(recordId: number): Promise<EmotionRecord> {
    const response = await apiClient.get(`/emotion/records/${recordId}`);
    return response.data;
  },

  // 获取一周情绪图表
  async getWeeklyChart(): Promise<WeeklyChart> {
    const response = await apiClient.get('/emotion/weekly-chart');
    return response.data;
  },

  // 获取性格档案
  async getCharacterProfile(): Promise<CharacterProfile> {
    const response = await apiClient.get('/emotion/character-profile');
    return response.data;
  },

  // 创建例外时刻
  async createExceptionMoment(data: CreateExceptionMomentRequest): Promise<ExceptionMoment> {
    const response = await apiClient.post('/emotion/exception-moments', data);
    return response.data;
  },

  // 获取例外时刻列表
  async getExceptionMoments(limit = 20, offset = 0): Promise<ExceptionMoment[]> {
    const response = await apiClient.get('/emotion/exception-moments', {
      params: { limit, offset }
    });
    return response.data;
  },

  // 创建价值行动
  async createValueAction(data: CreateValueActionRequest): Promise<ValueAction> {
    const response = await apiClient.post('/emotion/value-actions', data);
    return response.data;
  },

  // 获取价值行动列表
  async getValueActions(status?: number, limit = 20, offset = 0): Promise<ValueAction[]> {
    const response = await apiClient.get('/emotion/value-actions', {
      params: { status, limit, offset }
    });
    return response.data;
  },

  // 更新价值行动状态
  async updateValueActionStatus(actionId: number, status: number): Promise<{ success: boolean }> {
    const response = await apiClient.patch(`/emotion/value-actions/${actionId}/status`, null, {
      params: { status }
    });
    return response.data;
  }
};
