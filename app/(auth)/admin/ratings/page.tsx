'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsDown, ThumbsUp, User, Calendar, MessageSquare, Filter, Search } from 'lucide-react';
import { api } from '@/app/lib/api';

interface MessageRating {
  id: number;
  message_id: number;
  message_content: string | null;
  message_role: string | null;
  message_created_at: string | null;
  rating_type: string;
  reason: string | null;
  paipan_data: any;
  created_at: string;
  user_id: number | null;
  user_email: string | null;
  user_username: string | null;
}

interface RatingListResponse {
  items: MessageRating[];
  total: number;
  page: number;
  page_size: number;
}

const REASON_MAP: Record<string, string> = {
  inaccurate: '内容不准确',
  irrelevant: '内容不相关',
  unclear: '表述不清晰',
  inappropriate: '内容不合适',
  other: '其他',
};

export default function MessageRatingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<MessageRating[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [ratingTypeFilter, setRatingTypeFilter] = useState<string>('down'); // 默认只显示点踩
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // 验证管理员权限
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/ratings');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/ratings');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/ratings');
      return;
    }

    loadRatings();
  }, [page, ratingTypeFilter, router]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (ratingTypeFilter) params.append('rating_type', ratingTypeFilter);

      const response = await fetch(api(`/chat/messages/admin/ratings?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('加载失败');

      const data: RatingListResponse = await response.json();
      setRatings(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('加载评价列表失败:', error);
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

  const filteredRatings = ratings.filter(rating =>
    searchTerm === '' ||
    rating.message_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rating.user_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && ratings.length === 0) {
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
                消息评价管理
              </h1>
              <p className="text-[var(--color-text-muted)]">
                共 {total} 条评价
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="搜索消息内容、理由、用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all"
              />
            </div>

            {/* 评价类型筛选 */}
            <select
              value={ratingTypeFilter}
              onChange={(e) => {
                setRatingTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none transition-all"
            >
              <option value="">全部评价</option>
              <option value="down">仅点踩</option>
              <option value="up">仅点赞</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">点踩数量</div>
                <div className="text-xl font-bold text-[var(--color-text-primary)]">
                  {ratings.filter(r => r.rating_type === 'down').length}
                </div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">点赞数量</div>
                <div className="text-xl font-bold text-[var(--color-text-primary)]">
                  {ratings.filter(r => r.rating_type === 'up').length}
                </div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">总评价数</div>
                <div className="text-xl font-bold text-[var(--color-text-primary)]">
                  {total}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating List */}
        <div className="space-y-4">
          {filteredRatings.length === 0 ? (
            <div className="card p-12 text-center">
              <MessageSquare className="w-12 h-12 text-[var(--color-text-hint)] mx-auto mb-4" />
              <p className="text-[var(--color-text-muted)]">暂无评价</p>
            </div>
          ) : (
            filteredRatings.map((rating) => (
              <div key={rating.id} className="card p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rating.rating_type === 'down'
                        ? 'bg-red-100'
                        : 'bg-green-100'
                    }`}
                  >
                    {rating.rating_type === 'down' ? (
                      <ThumbsDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                          rating.rating_type === 'down'
                            ? 'bg-red-600'
                            : 'bg-green-600'
                        }`}
                      >
                        {rating.rating_type === 'down' ? '点踩' : '点赞'}
                      </span>
                      {rating.reason && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {REASON_MAP[rating.reason] || rating.reason}
                        </span>
                      )}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        #{rating.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4 mb-4">
                  <div className="text-xs text-[var(--color-text-muted)] mb-2">
                    AI 回复内容:
                  </div>
                  {rating.message_content && rating.message_content.length > 300 ? (
                    <details className="group">
                      <summary className="cursor-pointer text-[var(--color-text-primary)] list-none">
                        <div className="line-clamp-3 group-open:line-clamp-none">
                          {rating.message_content}
                        </div>
                        <div className="text-xs text-[var(--color-primary)] mt-2 group-open:hidden">
                          点击展开完整内容 ▼
                        </div>
                        <div className="text-xs text-[var(--color-primary)] mt-2 hidden group-open:block">
                          点击收起 ▲
                        </div>
                      </summary>
                    </details>
                  ) : (
                    <div className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {rating.message_content || '（无内容）'}
                    </div>
                  )}
                </div>

                {/* Custom Reason (if exists and is long) */}
                {rating.reason && rating.reason.length > 20 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="text-xs text-yellow-800 mb-1 font-medium">
                      用户自定义理由:
                    </div>
                    <div className="text-sm text-yellow-900">
                      {rating.reason}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>
                      {rating.user_username || rating.user_email || '匿名用户'}
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(rating.created_at)}</span>
                  </div>
                  {rating.message_created_at && (
                    <>
                      <span>•</span>
                      <span>消息时间: {formatDate(rating.message_created_at)}</span>
                    </>
                  )}
                </div>

                {/* Paipan Data (if exists) */}
                {rating.paipan_data && (
                  <details className="mt-4 group">
                    <summary className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-primary)] transition-colors list-none flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      查看命盘数据
                    </summary>
                    <div className="mt-3 p-4 bg-[var(--color-bg-elevated)] rounded-lg">
                      {/* Four Pillars */}
                      {rating.paipan_data.four_pillars && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                            四柱八字
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {['year', 'month', 'day', 'hour'].map((pillar, idx) => {
                              const pillarData = rating.paipan_data.four_pillars[pillar];
                              const labels = ['年柱', '月柱', '日柱', '时柱'];
                              return (
                                <div key={pillar} className="bg-white rounded-lg p-3 text-center border border-[var(--color-border)]">
                                  <div className="text-xs text-[var(--color-text-muted)] mb-1">
                                    {labels[idx]}
                                  </div>
                                  <div className="text-lg font-bold text-[var(--color-text-primary)]">
                                    {pillarData ? pillarData.join('') : '-'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Dayun */}
                      {rating.paipan_data.dayun && rating.paipan_data.dayun.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                            大运（前5步）
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {rating.paipan_data.dayun.slice(0, 5).map((du: any, idx: number) => (
                              <div key={idx} className="bg-white rounded-lg p-2 text-center border border-[var(--color-border)]">
                                <div className="text-xs text-[var(--color-text-muted)]">
                                  {du.age}岁
                                </div>
                                <div className="text-sm font-bold text-[var(--color-text-primary)]">
                                  {du.pillar ? du.pillar.join('') : '-'}
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                  {du.start_year}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw JSON (fallback) */}
                      {!rating.paipan_data.four_pillars && !rating.paipan_data.dayun && (
                        <pre className="text-xs overflow-auto text-[var(--color-text-primary)]">
                          {JSON.stringify(rating.paipan_data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))
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
