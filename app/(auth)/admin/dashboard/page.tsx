'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '@/app/lib/api';

interface OverviewData {
  users: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    active_7d: number;
  };
  conversations: {
    total: number;
    today: number;
  };
  messages: {
    total: number;
    tokens_used: number;
  };
  feedbacks: {
    pending: number;
  };
}

interface TrendData {
  date: string;
  count: number;
}

interface SourceData {
  source: string;
  label: string;
  count: number;
}

const COLORS = ['#a83232', '#e5c07b', '#22c55e', '#3b82f6', '#8b5cf6'];

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color
}: {
  title: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-sm text-[var(--color-text-hint)] mt-1">{subValue}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [usersTrend, setUsersTrend] = useState<TrendData[]>([]);
  const [usersSource, setUsersSource] = useState<SourceData[]>([]);
  const [convTrend, setConvTrend] = useState<TrendData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [overviewRes, trendRes, sourceRes, convRes] = await Promise.all([
        fetch(api('/admin/stats/overview'), { headers }),
        fetch(api('/admin/stats/users/trend?period=30d'), { headers }),
        fetch(api('/admin/stats/users/source'), { headers }),
        fetch(api('/admin/stats/conversations/trend?period=7d'), { headers }),
      ]);

      if (!overviewRes.ok) {
        if (overviewRes.status === 401 || overviewRes.status === 403) {
          router.push('/login?redirect=/admin/dashboard');
          return;
        }
        throw new Error('获取数据失败');
      }

      const [overviewData, trendData, sourceData, convData] = await Promise.all([
        overviewRes.json(),
        trendRes.json(),
        sourceRes.json(),
        convRes.json(),
      ]);

      setOverview(overviewData);
      setUsersTrend(trendData.data || []);
      setUsersSource(sourceData.data || []);
      setConvTrend(convData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 检查管理员权限
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/dashboard');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/dashboard');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/dashboard');
      return;
    }

    fetchData();
  }, [router]);

  if (loading) {
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
            <div>
              <h1
                className="text-2xl font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                数据概览
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                实时统计数据
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {error && (
          <div className="card p-4 mb-6 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {overview && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="总用户数"
                value={overview.users.total}
                subValue={`今日 +${overview.users.today}`}
                icon={Users}
                color="#a83232"
              />
              <StatCard
                title="活跃用户"
                value={overview.users.active_7d}
                subValue="近7天登录"
                icon={TrendingUp}
                color="#22c55e"
              />
              <StatCard
                title="总对话数"
                value={overview.conversations.total}
                subValue={`今日 +${overview.conversations.today}`}
                icon={MessageSquare}
                color="#3b82f6"
              />
              <StatCard
                title="待处理反馈"
                value={overview.feedbacks.pending}
                icon={AlertCircle}
                color="#f59e0b"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* User Registration Trend */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  用户注册趋势（近30天）
                </h3>
                <div className="h-64">
                  {usersTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={usersTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                          labelFormatter={(value) => `日期: ${value}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#a83232"
                          strokeWidth={2}
                          dot={{ fill: '#a83232', strokeWidth: 2 }}
                          name="新增用户"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[var(--color-text-hint)]">
                      暂无数据
                    </div>
                  )}
                </div>
              </div>

              {/* User Source Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  用户来源分布
                </h3>
                <div className="h-64">
                  {usersSource.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usersSource}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props) => {
                            const data = props.payload as SourceData;
                            const percent = props.percent as number;
                            return `${data.label} ${(percent * 100).toFixed(0)}%`;
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {usersSource.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                          formatter={(value, _name, props) => {
                            const data = props.payload as SourceData;
                            return [value, data.label];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[var(--color-text-hint)]">
                      暂无数据
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                对话量趋势（近7天）
              </h3>
              <div className="h-64">
                {convTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={convTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        labelFormatter={(value) => `日期: ${value}`}
                      />
                      <Bar
                        dataKey="count"
                        fill="#e5c07b"
                        radius={[4, 4, 0, 0]}
                        name="对话数"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[var(--color-text-hint)]">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="card p-4">
                <p className="text-sm text-[var(--color-text-muted)]">本周新增用户</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {overview.users.this_week}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-[var(--color-text-muted)]">本月新增用户</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {overview.users.this_month}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-[var(--color-text-muted)]">总消息数</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {overview.messages.total.toLocaleString()}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}