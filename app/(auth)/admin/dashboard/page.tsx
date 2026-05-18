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
  UserCheck,
  Target,
  Repeat,
  Activity
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
  Bar
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
  [key: string]: string | number;
}

// Use design system colors for pie chart
const PIE_COLORS = [
  'var(--color-primary)',
  'var(--color-gold)',
  'var(--color-mist-deep)',
  'var(--color-text-secondary)',
  'var(--color-text-muted)'
];

// Primary metric card - larger, more prominent
function PrimaryMetric({
  title,
  value,
  subValue,
  icon: Icon
}: {
  title: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="card p-6 border border-[var(--color-border)]">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded flex items-center justify-center bg-[var(--color-bg-alt)]">
          <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">{title}</p>
          <p
            className="text-4xl font-medium text-[var(--color-text-primary)] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-sm text-[var(--color-text-secondary)]">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Secondary metric - compact, list-style
function SecondaryMetric({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number | string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0">
      {Icon && (
        <div className="w-8 h-8 rounded flex items-center justify-center bg-[var(--color-bg-alt)] flex-shrink-0">
          <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
      </div>
      <p className="text-lg font-medium text-[var(--color-text-primary)] tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
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
    // Check admin permission
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
        <div
          className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin"
          role="status"
          aria-label="加载中"
        />
        <span className="sr-only">加载中...</span>
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
                className="text-2xl font-medium text-[var(--color-text-primary)]"
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
            aria-live="polite"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '刷新中' : '刷新'}
          </button>
        </div>

        {error && (
          <div
            className="card p-4 mb-6 border border-[var(--color-primary)] bg-[var(--color-bg-elevated)]"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[var(--color-text-primary)] mb-1">加载错误</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {overview && (
          <>
            {/* Primary Metrics - 2 column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <PrimaryMetric
                title="总用户数"
                value={overview.users.total}
                subValue={`今日新增 ${overview.users.today}`}
                icon={Users}
              />
              <PrimaryMetric
                title="总对话数"
                value={overview.conversations.total}
                subValue={`今日新增 ${overview.conversations.today}`}
                icon={MessageSquare}
              />
            </div>

            {/* Secondary Metrics - Compact list in card */}
            <div className="card p-6 mb-6 border border-[var(--color-border)]">
              <h3
                className="text-base font-medium text-[var(--color-text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                关键指标
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
                <SecondaryMetric
                  label="活跃用户（7日）"
                  value={overview.users.active_7d}
                  icon={TrendingUp}
                />
                <SecondaryMetric
                  label="待处理反馈"
                  value={overview.feedbacks.pending}
                  icon={AlertCircle}
                />
                <SecondaryMetric
                  label="新用户成功率"
                  value="待接入"
                  icon={UserCheck}
                />
                <SecondaryMetric
                  label="首次解读后问率"
                  value="待接入"
                  icon={Target}
                />
                <SecondaryMetric
                  label="7日复访率"
                  value="待接入"
                  icon={Repeat}
                />
                <SecondaryMetric
                  label="付费转化率"
                  value="待接入"
                  icon={Activity}
                />
                <SecondaryMetric
                  label="本周新增"
                  value={overview.users.this_week}
                />
                <SecondaryMetric
                  label="本月新增"
                  value={overview.users.this_month}
                />
                <SecondaryMetric
                  label="总消息数"
                  value={overview.messages.total}
                />
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* User Registration Trend */}
              <div className="card p-6 border border-[var(--color-border)]">
                <h3
                  className="text-base font-medium text-[var(--color-text-primary)] mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  用户注册趋势（近30天）
                </h3>
                <div className="h-64" role="img" aria-label="用户注册趋势折线图">
                  {usersTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={usersTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          strokeOpacity={0.5}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 12,
                            fill: 'var(--color-text-muted)'
                          }}
                          tickFormatter={(value) => value.slice(5)}
                          stroke="var(--color-border)"
                        />
                        <YAxis
                          tick={{
                            fontSize: 12,
                            fill: 'var(--color-text-muted)'
                          }}
                          stroke="var(--color-border)"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            color: 'var(--color-text-primary)'
                          }}
                          labelStyle={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '12px'
                          }}
                          labelFormatter={(value) => `日期: ${value}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="var(--color-primary)"
                          strokeWidth={2}
                          dot={{
                            fill: 'var(--color-primary)',
                            strokeWidth: 0,
                            r: 3
                          }}
                          activeDot={{ r: 5 }}
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
              <div className="card p-6 border border-[var(--color-border)]">
                <h3
                  className="text-base font-medium text-[var(--color-text-primary)] mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  用户来源分布
                </h3>
                <div className="h-64" role="img" aria-label="用户来源分布饼图">
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
                          fill="var(--color-primary)"
                          dataKey="count"
                        >
                          {usersSource.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            color: 'var(--color-text-primary)'
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
            <div className="card p-6 border border-[var(--color-border)]">
              <h3
                className="text-base font-medium text-[var(--color-text-primary)] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                对话量趋势（近7天）
              </h3>
              <div className="h-64" role="img" aria-label="对话量趋势柱状图">
                {convTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={convTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 12,
                          fill: 'var(--color-text-muted)'
                        }}
                        tickFormatter={(value) => value.slice(5)}
                        stroke="var(--color-border)"
                      />
                      <YAxis
                        tick={{
                          fontSize: 12,
                          fill: 'var(--color-text-muted)'
                        }}
                        stroke="var(--color-border)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-md)',
                          color: 'var(--color-text-primary)'
                        }}
                        labelStyle={{
                          color: 'var(--color-text-secondary)',
                          fontSize: '12px'
                        }}
                        labelFormatter={(value) => `日期: ${value}`}
                      />
                      <Bar
                        dataKey="count"
                        fill="var(--color-gold)"
                        radius={[2, 2, 0, 0]}
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
          </>
        )}
      </div>
    </main>
  );
}
