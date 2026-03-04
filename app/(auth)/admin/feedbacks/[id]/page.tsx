'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Calendar, MessageSquare, Send, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { api } from '@/app/lib/api';

interface Feedback {
  id: number;
  type: string;
  content: string;
  contact: string | null;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: number | null;
  user_email: string | null;
  user_username: string | null;
  replied_by: number | null;
  replied_by_username: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待处理', color: '#f59e0b', icon: Clock },
  processing: { label: '处理中', color: '#3b82f6', icon: AlertCircle },
  resolved: { label: '已解决', color: '#22c55e', icon: CheckCircle },
  closed: { label: '已关闭', color: '#6b7280', icon: XCircle },
};

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  bug: { label: 'Bug反馈', color: '#ef4444' },
  feature: { label: '功能建议', color: '#8b5cf6' },
  question: { label: '问题咨询', color: '#3b82f6' },
  other: { label: '其他', color: '#6b7280' },
};

export default function FeedbackDetailPage() {
  const router = useRouter();
  const params = useParams();
  const feedbackId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    // 验证管理员权限
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/feedbacks');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/feedbacks');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/feedbacks');
      return;
    }

    loadFeedback();
  }, [feedbackId, router]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(api(`/admin/feedbacks/${feedbackId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('加载失败');

      const data: Feedback = await response.json();
      setFeedback(data);
      setNewStatus(data.status);
      if (data.admin_reply) {
        setReply(data.admin_reply);
      }
    } catch (error) {
      console.error('加载反馈详情失败:', error);
      alert('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) {
      alert('请输入回复内容');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(api(`/admin/feedbacks/${feedbackId}/reply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: reply.trim() }),
      });

      if (!response.ok) throw new Error('回复失败');

      const data: Feedback = await response.json();
      setFeedback(data);
      alert('回复成功');
    } catch (error) {
      console.error('回复失败:', error);
      alert('回复失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(api(`/admin/feedbacks/${feedbackId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('更新失败');

      const data: Feedback = await response.json();
      setFeedback(data);
      setNewStatus(data.status);
      alert('状态更新成功');
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!feedback) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-muted)] mb-4">反馈不存在</p>
          <Link href="/admin/feedbacks" className="text-[var(--color-primary)] hover:underline">
            返回列表
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = STATUS_MAP[feedback.status] || STATUS_MAP.pending;
  const typeInfo = TYPE_MAP[feedback.type] || TYPE_MAP.other;
  const StatusIcon = statusInfo.icon;

  return (
    <main className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/feedbacks"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回反馈列表
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: typeInfo.color }}
            >
              {typeInfo.label}
            </span>
            <span
              className="px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1"
              style={{
                backgroundColor: `${statusInfo.color}20`,
                color: statusInfo.color
              }}
            >
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              #{feedback.id}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            反馈详情
          </h1>
        </div>

        {/* User Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            用户信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[var(--color-text-muted)]" />
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">用户名</div>
                <div className="text-[var(--color-text-primary)]">
                  {feedback.user_username || '匿名用户'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">联系方式</div>
                <div className="text-[var(--color-text-primary)]">
                  {feedback.contact || feedback.user_email || '未提供'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--color-text-muted)]" />
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">提交时间</div>
                <div className="text-[var(--color-text-primary)]">
                  {formatDate(feedback.created_at)}
                </div>
              </div>
            </div>
            {feedback.replied_at && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[var(--color-text-muted)]" />
                <div>
                  <div className="text-xs text-[var(--color-text-muted)]">回复时间</div>
                  <div className="text-[var(--color-text-primary)]">
                    {formatDate(feedback.replied_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Content */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            反馈内容
          </h2>
          <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4 whitespace-pre-wrap text-[var(--color-text-primary)]">
            {feedback.content}
          </div>
        </div>

        {/* Admin Reply */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            管理员回复
          </h2>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="输入回复内容..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all resize-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[var(--color-text-muted)]">
              {feedback.replied_by_username && (
                <span>上次回复: {feedback.replied_by_username}</span>
              )}
            </div>
            <button
              onClick={handleReply}
              disabled={submitting || !reply.trim()}
              className="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? '提交中...' : '提交回复'}
            </button>
          </div>
        </div>

        {/* Status Management */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            状态管理
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(STATUS_MAP).map(([key, { label, color, icon: Icon }]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                disabled={submitting || feedback.status === key}
                className={`p-4 rounded-lg border-2 transition-all ${
                  feedback.status === key
                    ? 'border-current'
                    : 'border-[var(--color-border)] hover:border-current'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  color: feedback.status === key ? color : 'var(--color-text-secondary)',
                  backgroundColor: feedback.status === key ? `${color}10` : 'transparent'
                }}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium text-center">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
