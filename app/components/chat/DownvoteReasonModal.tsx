'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { DOWNVOTE_REASONS, type RatingReason, type Paipan } from '@/app/lib/chat/rating';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: RatingReason) => void;
}

export function DownvoteReasonModal({ isOpen, onClose, onSubmit }: Props) {
  const [selectedReason, setSelectedReason] = useState<RatingReason | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      onSubmit(selectedReason);
      setSelectedReason(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
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
                  onChange={(e) => setSelectedReason(e.target.value as RatingReason)}
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
            disabled={!selectedReason || isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  );
}
