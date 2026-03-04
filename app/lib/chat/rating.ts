// lib/chat/rating.ts
import { api, postJSON } from '@/app/lib/api';
import type { Paipan } from './types';

export type { Paipan } from './types';
export type RatingType = 'up' | 'down';
export type RatingReason = 'inaccurate' | 'irrelevant' | 'unclear' | 'inappropriate' | 'other';

export interface MessageRatingCreate {
  rating_type: RatingType;
  reason?: RatingReason;
  custom_reason?: string;  // 自定义理由（当reason=other时）
  paipan_data?: Paipan;
}

export interface MessageRatingResp {
  id: number;
  rating_type: string;
  reason?: string;
  created_at: string;
}

export interface UserRatingResp {
  message_id: number;
  user_rating?: MessageRatingResp;
}

export interface MessageRatingOkResp {
  ok: boolean;
}

/**
 * 提交消息评价（点赞/点踩）
 * @param messageId 消息ID
 * @param ratingType 评价类型：up=点赞, down=点踩
 * @param reason 点踩原因（仅在ratingType=down时需要）
 * @param paipanData 命盘数据（点踩时保存用于后续分析）
 * @param customReason 自定义理由（当reason=other时提供）
 */
export async function submitRating(
  messageId: number,
  ratingType: RatingType,
  reason?: RatingReason,
  paipanData?: Paipan,
  customReason?: string
): Promise<MessageRatingOkResp> {
  const body: MessageRatingCreate = {
    rating_type: ratingType,
  };

  if (reason) {
    body.reason = reason;
  }

  if (customReason) {
    body.custom_reason = customReason;
  }

  if (paipanData) {
    body.paipan_data = paipanData;
  }

  return postJSON<MessageRatingOkResp>(
    api(`/chat/messages/${messageId}/rating`),
    body
  );
}

/**
 * 获取当前用户对指定消息的评价状态
 * @param messageId 消息ID
 */
export async function getRating(messageId: number): Promise<UserRatingResp> {
  const r = await fetch(api(`/chat/messages/${messageId}/rating`), {
    credentials: 'include',
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(text || `HTTP ${r.status}`);
  }

  return r.json() as Promise<UserRatingResp>;
}

/**
 * 点踩原因选项配置
 */
export const DOWNVOTE_REASONS: Array<{ value: RatingReason; label: string; description: string }> = [
  { value: 'inaccurate', label: '内容不准确', description: '解读与命盘信息不符' },
  { value: 'irrelevant', label: '内容不相关', description: '未回答我的问题' },
  { value: 'unclear', label: '表述不清晰', description: '内容难以理解' },
  { value: 'inappropriate', label: '内容不合适', description: '包含不当内容' },
  { value: 'other', label: '其他', description: '' },
];
