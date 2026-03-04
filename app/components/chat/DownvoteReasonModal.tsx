'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { DOWNVOTE_REASONS, type RatingReason, type Paipan } from '@/app/lib/chat/rating';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: RatingReason, customReason?: string) => Promise<void>;
}

export function DownvoteReasonModal({ isOpen, onClose, onSubmit }: Props) {
  const [selectedReason, setSelectedReason] = useState<RatingReason | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    // 如果选择了"其他"，验证自定义理由
    if (selectedReason === 'other') {
      const trimmed = customReason.trim();
      if (trimmed.length < 15) {
        setError('请输入至少15个字的理由');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    try {
      // 传递自定义理由（如果有）
      await onSubmit(selectedReason, selectedReason === 'other' ? customReason.trim() : undefined);
      // 提交成功后重置状态
      setSelectedReason(null);
      setCustomReason('');
    } catch (err) {
      setError('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
            告诉我们原因
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            请选择不满意的理由：
          </p>

          <div className="space-y-2">
            {DOWNVOTE_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedReason === reason.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <input
                  type="radio"
                  name="downvote-reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => {
                    setSelectedReason(e.target.value as RatingReason);
                    setError('');
                  }}
                  className="mt-0.5 w-4 h-4 text-[var(--color-primary)] border-[var(--color-border)] focus:ring-[var(--color-primary)]"
                />
                <div className="flex-1">
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {reason.label}
                  </div>
                  {reason.description && (
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {reason.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* 自定义理由输入框（选择"其他"时显示） */}
          {selectedReason === 'other' && (
            <div className="mt-4">
              <textarea
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError('');
                }}
                placeholder="请详细说明您的理由（至少15个字）"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${
                  customReason.trim().length < 15
                    ? 'text-red-500 font-medium'
                    : 'text-[var(--color-gold)] font-medium'
                }`}>
                  {customReason.trim().length < 15
                    ? `还需 ${15 - customReason.trim().length} 字`
                    : '✓ 已满足要求'}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {customReason.trim().length} / 15 字
                </span>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting || (selectedReason === 'other' && customReason.trim().length < 15)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedReason || isSubmitting || (selectedReason === 'other' && customReason.trim().length < 15)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[var(--color-primary)] text-white hover:opacity-90 cursor-pointer'
            }`}
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  );
}
