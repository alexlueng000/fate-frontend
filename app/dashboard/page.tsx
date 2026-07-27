'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Dices,
  History,
  Loader2,
  MessageSquare,
} from 'lucide-react';

import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import {
  historyApi,
  type ConversationListItem,
  type HistoryType,
} from '@/app/lib/history/api';
import { trackEvent } from '@/app/lib/analytics/track';
import {
  TodayReminderCard,
  type TodayReminder,
} from './components/TodayReminderCard';
import { ContinueLastCard } from './components/ContinueLastCard';
import { RecentRecords } from './components/RecentRecords';

type Profile = {
  id: number;
  gender: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  display_info?: string;
  bazi_chart?: Record<string, unknown> | null;
};

type DashboardData = {
  profile: Profile | null;
  baziItems: ConversationListItem[];
  liuyaoItems: ConversationListItem[];
};

const NEW_ANALYSIS_ENTRIES = [
  {
    title: '八字长期趋势',
    description: '适合看长期方向、性格优势、事业路径、关系模式和阶段运势。',
    cta: '开始八字分析',
    href: '/panel',
    icon: MessageSquare,
  },
  {
    title: '六爻具体问题',
    description: '适合判断一个具体事项：要不要合作、能不能成、是否继续、对方态度如何。',
    cta: '起一卦',
    href: '/liuyao',
    icon: Dices,
  },
];

function latestConversation(data: DashboardData): { item: ConversationListItem; type: HistoryType } | null {
  const candidates = [
    ...data.baziItems.map((item) => ({ item, type: 'bazi' as const })),
    ...data.liuyaoItems.map((item) => ({ item, type: 'liuyao' as const })),
  ];
  if (!candidates.length) return null;
  return candidates.sort((a, b) => new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime())[0];
}

function getDayMaster(profile: Profile | null): string | null {
  const chart = profile?.bazi_chart;
  if (!chart) return null;
  const mingpan = (chart.mingpan as Record<string, unknown> | undefined) ?? chart;
  const fp = mingpan.four_pillars as Record<string, unknown> | undefined;
  const day = fp?.day as Record<string, unknown> | string[] | undefined;
  if (Array.isArray(day)) return typeof day[0] === 'string' ? day[0] : null;
  return typeof day?.stem === 'string' ? day.stem : null;
}

function LoadingView() {
  return (
    <main className="min-h-full bg-[var(--color-bg)] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在整理命理首页
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const routeLoading = useRouteGuard(true, false);
  const [data, setData] = useState<DashboardData>({ profile: null, baziItems: [], liuyaoItems: [] });
  const [profileLoading, setProfileLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayReminder, setTodayReminder] = useState<TodayReminder | null>(null);

  useEffect(() => {
    if (routeLoading) return;
    let alive = true;
    trackEvent('dashboard_view');

    async function load() {
      setError(null);
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      setProfileLoading(true);
      fetch(api('/profile/me'), { headers, credentials: 'include' })
        .then(async (profileResp) => {
          if (!profileResp.ok) throw new Error('档案加载失败');
          const profile = await profileResp.json();
          if (!alive) return;
          setData((current) => ({ ...current, profile }));
        })
        .catch((e) => {
          if (alive) setError(e instanceof Error ? e.message : '档案加载失败');
        })
        .finally(() => {
          if (alive) setProfileLoading(false);
        });

      fetch(api('/bazi/today_reminder'), { headers, credentials: 'include' })
        .then(async (resp) => {
          if (!resp.ok) throw new Error('today reminder load failed');
          const info = await resp.json();
          if (!alive) return;
          setTodayReminder(info);
        })
        .catch(() => {
          if (alive) setTodayReminder(null);
        });

      setHistoryLoading(true);
      Promise.all([
        historyApi.list('bazi', 0, 4),
        historyApi.list('liuyao', 0, 4),
      ])
        .then(([bazi, liuyao]) => {
          if (!alive) return;
          setData((current) => ({
            ...current,
            baziItems: bazi.items,
            liuyaoItems: liuyao.items,
          }));
        })
        .catch((e) => {
          if (alive) setError(e instanceof Error ? e.message : '记录加载失败');
        })
        .finally(() => {
          if (alive) setHistoryLoading(false);
        });
    }

    void load();
    return () => { alive = false; };
  }, [routeLoading]);

  const latest = useMemo(() => latestConversation(data), [data]);
  const dayMaster = getDayMaster(data.profile);
  const recentItems = useMemo(
    () => [
      ...data.baziItems.map((item) => ({ item, type: 'bazi' as const })),
      ...data.liuyaoItems.map((item) => ({ item, type: 'liuyao' as const })),
    ].sort((a, b) => new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime()).slice(0, 5),
    [data.baziItems, data.liuyaoItems],
  );

  if (routeLoading) return <LoadingView />;

  return (
    <main className="min-h-full bg-[var(--color-bg)] px-4 pb-24 pt-5 sm:px-8 sm:pb-10 sm:pt-7">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 border-b border-[var(--color-border)] pb-5 sm:mb-8 sm:flex sm:items-end sm:justify-between sm:gap-8">
          <div className="max-w-2xl">
            <p className="mb-2 text-[13px] font-medium tracking-[0.04em] text-[var(--color-text-muted)]">今日命理概览</p>
            <h1 className="font-serif text-[1.45rem] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[1.9rem]">
              回到你的问题，而不是重新开始。
            </h1>
            <p className="mt-3 text-[16px] leading-7 text-[var(--color-text-secondary)]">
              八字看长期趋势，六爻看具体事项。这里先帮你接上当前最重要的一步。
            </p>
          </div>
          <div className="mt-4 text-sm leading-6 text-[var(--color-text-muted)] sm:mt-0 sm:text-right">
            {data.profile?.display_info || data.profile?.birth_location ? (
              <>
                <div>{data.profile.display_info || data.profile.birth_location}</div>
                {dayMaster && <div>日主：{dayMaster}</div>}
              </>
            ) : profileLoading ? (
              <div>正在读取你的默认档案</div>
            ) : (
              <Link href="/profile/create" className="text-[var(--color-primary)] hover:underline">
                完善个人档案
              </Link>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-5 border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-4 py-3 text-sm text-[var(--color-primary-deeper)]">
            {error}
          </div>
        )}

        <div className="mb-5">
          <TodayReminderCard reminder={todayReminder} />
        </div>

        <section className="grid gap-4">
          <ContinueLastCard latest={latest} loading={historyLoading} />

          <div className="grid gap-4 lg:grid-cols-2">
            {NEW_ANALYSIS_ENTRIES.map(({ title, description, cta, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group grid min-h-[164px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">新开分析</p>
                    <h2 className="mt-2 font-serif text-xl font-medium leading-snug text-[var(--color-text-primary)]">
                      {title}
                    </h2>
                  </div>
                  <Icon className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.6} />
                </div>
                <p className="mt-3 text-[15px] leading-7 text-[var(--color-text-body)]">{description}</p>
                <span className="mt-5 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[3px] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-bg)]">
                  {cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <RecentRecords items={recentItems} loading={historyLoading} />

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/report"
            className="flex min-h-14 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
          >
            <BookOpen className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.6} />
            查看命理报告
          </Link>
          <Link
            href="/history"
            className="flex min-h-14 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
          >
            <History className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.6} />
            查看全部记录
          </Link>
          <Link
            href="/faq"
            className="flex min-h-14 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
          >
            <CircleHelp className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.6} />
            常见问题
          </Link>
        </section>
      </div>
    </main>
  );
}
