'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitRating, type RatingReason } from '@/app/lib/chat/rating';
import { DownvoteReasonModal } from './DownvoteReasonModal';

interface Props {
  messageId: number;
  userRating?: { ratingType: 'up' | 'down'; reason?: string };
  paipanData?: any;
  onRated: (rating: { ratingType: 'up' | 'down'; reason?: string }) => void;
}

export function MessageRating({ messageId, userRating, paipanData, onRated }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRating = userRating?.ratingType;

  const handleUpvote = async () => {
    // 如果已经点赞，取消点赞（通过提交相同评价来更新，或者可以添加取消逻辑）
    // 这里简化处理：点击即提交/更新评价
    setIsSubmitting(true);
    try {
      await submitRating(messageId, 'up');
      onRated({ ratingType: 'up' });
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownvote = async (reason: RatingReason) => {
    setIsSubmitting(true);
    try {
      await submitRating(messageId, 'down', reason, paipanData);
      onRated({ ratingType: 'down', reason });
      setIsModalOpen(false);
    } catch (error) {
      console.error('点踩失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownvoteClick = () => {
    // 如果已经点踩，不允许再次点击
    if (currentRating === 'down') {
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* 点赞按钮 */}
        <button
          onClick={handleUpvote}
          disabled={isSubmitting || currentRating === 'down'}
          className={`p-1.5 rounded-lg transition-all ${
            currentRating === 'up'
              ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/20 shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-hover)]'
          } ${currentRating === 'down' ? 'opacity-40 cursor-not-allowed' : ''} ${isSubmitting ? 'opacity-50' : ''}`}
          aria-label="点赞"
          title={currentRating === 'up' ? '已点赞' : '点赞'}
        >
          <ThumbsUp className={`w-4 h-4 ${currentRating === 'up' ? 'fill-current' : ''}`} />
        </button>

        {/* 点踩按钮 */}
        <button
          onClick={handleDownvoteClick}
          disabled={isSubmitting || currentRating === 'up' || currentRating === 'down'}
          className={`p-1.5 rounded-lg transition-all ${
            currentRating === 'down'
              ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/20 shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)]'
          } ${currentRating === 'up' || currentRating === 'down' ? 'opacity-40 cursor-not-allowed' : ''} ${isSubmitting ? 'opacity-50' : ''}`}
          aria-label="点踩"
          title={currentRating === 'down' ? '已点踩' : '点踩'}
        >
          <ThumbsDown className={`w-4 h-4 ${currentRating === 'down' ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 点踩原因弹窗 */}
      <DownvoteReasonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleDownvote}
      />
    </>
  );
}
