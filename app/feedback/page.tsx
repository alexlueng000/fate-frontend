'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import Footer from '@/app/components/Footer';
import { useUser, getAuthToken } from '@/app/lib/auth';
import { api, postJSON } from '@/app/lib/api';

type FeedbackType = 'bug' | 'feature' | 'question' | 'other';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; emoji: string }[] = [
  { value: 'bug', label: '问题反馈', emoji: '🐛' },
  { value: 'feature', label: '功能建议', emoji: '💡' },
  { value: 'question', label: '使用咨询', emoji: '❓' },
  { value: 'other', label: '其他', emoji: '📝' },
];

interface FeedbackResponse {
  id: number;
  type: string;
  content: string;
  contact: string | null;
  status: string;
  created_at: string;
}

export default function FeedbackPage() {
  const { user } = useUser();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = content.trim().length >= 10 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await postJSON<FeedbackResponse>(
        api('/feedback'),
        {
          type: feedbackType,
          content,
          contact: contact || null,
        },
        { headers }
      );

      setFeedbackId(resp.id);
      setSubmitted(true);
    } catch (err) {
      setError((err as Error)?.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col pt-20">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1
              className="text-2xl font-bold text-[var(--color-text-primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              感谢您的反馈！
            </h1>
            <p className="text-[var(--color-text-muted)] mb-2">
              我们会认真阅读并尽快处理您的意见
            </p>
            {feedbackId && (
              <p className="text-sm text-[var(--color-text-hint)] mb-8">
                反馈编号：#{feedbackId}
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setContent('');
                  setContact('');
                  setFeedbackId(null);
                }}
                className="btn btn-secondary px-6 py-2"
              >
                继续反馈
              </button>
              <Link href="/account" className="btn btn-primary px-6 py-2">
                返回账户
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 返回链接 */}
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回账户
          </Link>

          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] mb-6">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-3xl font-bold text-[var(--color-text-primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              意见反馈
            </h1>
            <p className="text-[var(--color-text-muted)]">
              您的建议是我们进步的动力
            </p>
          </div>

          {/* 反馈表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 反馈类型 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                反馈类型
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFeedbackType(type.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      feedbackType === type.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30'
                    }`}
                  >
                    <span className="text-xl mb-1 block">{type.emoji}</span>
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 反馈内容 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                反馈内容 <span className="text-[var(--color-primary)]">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请详细描述您的问题或建议（至少10个字）..."
                rows={6}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all resize-none"
              />
              <div className="mt-2 flex justify-between text-xs">
                {content.trim().length > 0 && content.trim().length < 10 ? (
                  <span className="text-[var(--color-primary)]">还需输入 {10 - content.trim().length} 个字</span>
                ) : (
                  <span></span>
                )}
                <span className="text-[var(--color-text-hint)]">{content.length} / 1000</span>
              </div>
            </div>

            {/* 联系方式 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                联系方式（选填）
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={user?.email || '邮箱或手机号，方便我们回复您'}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  提交反馈
                </>
              )}
            </button>

            {/* 提示 */}
            <p className="text-xs text-[var(--color-text-hint)] text-center">
              您也可以通过邮箱 <span className="text-[var(--color-gold)]">windy46825@163.com</span> 联系我们
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
