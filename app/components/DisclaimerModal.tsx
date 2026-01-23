'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ open, onAccept }: DisclaimerModalProps) {
  // 禁用 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 - 不可点击关闭 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* 弹窗内容 */}
      <div className="card relative w-full max-w-2xl animate-scale-in p-6 sm:p-8">
        {/* 标题 + 图标 */}
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-[var(--color-primary)]" />
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            服务声明
          </h2>
        </div>

        {/* 免责声明内容（200-300字） */}
        <div className="space-y-4 text-[var(--color-text-secondary)] leading-relaxed max-h-[60vh] overflow-y-auto">
          <p>欢迎使用一盏大师！在使用本服务前，请仔细阅读以下声明：</p>

          <div className="space-y-3">
            <p><strong>1. 服务性质</strong></p>
            <p>本平台提供的八字命理分析基于传统理论与AI技术，仅供娱乐和参考，不构成任何专业建议。</p>

            <p><strong>2. 结果准确性</strong></p>
            <p>分析结果受多种因素影响，我们不保证其准确性或完整性。请勿将其作为人生重大决策的唯一依据。</p>

            <p><strong>3. 隐私保护</strong></p>
            <p>我们重视您的隐私，所有数据经过加密存储。详情请查看我们的<Link href="/privacy" className="text-[var(--color-primary)] hover:underline">隐私政策</Link>。</p>

            <p><strong>4. 使用责任</strong></p>
            <p>使用本服务即表示您理解并接受上述声明。更多详情请参阅<Link href="/terms" className="text-[var(--color-primary)] hover:underline">服务条款</Link>。</p>
          </div>
        </div>

        {/* 同意按钮 */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full btn btn-primary py-4 text-lg font-semibold"
          >
            我已阅读并同意
          </button>
          <p className="text-xs text-center text-[var(--color-text-hint)]">
            点击同意即表示您已阅读并接受我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
