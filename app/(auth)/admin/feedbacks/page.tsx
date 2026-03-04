'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react';
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

interface FeedbackListResponse {
  items: Feedback[];
  total: number;
  page: number;
  page_size: number;
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

export default function FeedbacksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

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

    loadFeedbacks();
  }, [page, statusFilter, typeFilter, router]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(api(`/admin/feedbacks?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('加载失败');

      const data: FeedbackListResponse = await response.json();
      setFeedbacks(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('加载反馈列表失败:', error);
      alert('加载失败，请重试');
    } finally {
      setLoading(false);
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

  const filteredFeedbacks = feedbacks.filter(fb =>
    searchTerm === '' ||
    fb.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.user_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && feedbacks.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回管理后台
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                用户反馈管理
              </h1>
              <p className="text-[var(--color-text-muted)]">
                共 {total} 条反馈
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="搜索内容、用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all"
              />
            </div>

            {/* 状态筛选 */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all"
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* 类型筛选 */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all"
            >
              <option value="">全部类型</option>
              {Object.entries(TYPE_MAP).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="card p-12 text-center">
              <MessageSquare className="w-12 h-12 text-[var(--color-text-hint)] mx-auto mb-4" />
              <p className="text-[var(--color-text-muted)]">暂无反馈</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => {
              const statusInfo = STATUS_MAP[feedback.status] || STATUS_MAP.pending;
              const typeInfo = TYPE_MAP[feedback.type] || TYPE_MAP.other;
              const StatusIcon = statusInfo.icon;

              return (
                <Link
                  key={feedback.id}
                  href={`/admin/feedbacks/${feedback.id}`}
                  className="card card-hover p-6 block"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${statusInfo.color}20` }}
                    >
                      <StatusIcon className="w-5 h-5" style={{ color: statusInfo.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${statusInfo.color}20`,
                            color: statusInfo.color
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          #{feedback.id}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-[var(--color-text-primary)] mb-2 line-clamp-2">
                        {feedback.content}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                        <span>
                          用户: {feedback.user_username || feedback.user_email || '匿名用户'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(feedback.created_at)}</span>
                        {feedback.admin_reply && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--color-gold)]">
                              已回复 by {feedback.replied_by_username}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <span className="text-[var(--color-text-muted)]">
              第 {page} / {Math.ceil(total / pageSize)} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
