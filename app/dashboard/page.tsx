'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  Dices,
  Heart,
  History,
  Loader2,
  MessageSquare,
  Sparkles,
  WalletCards,
} from 'lucide-react';

import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import {
  historyApi,
  type ConversationListItem,
  type HistoryType,
} from '@/app/lib/history/api';
import {
  loadCareerTaskContext,
  saveCareerTaskContext,
  type CareerTaskContext,
} from '@/app/lib/tasks/career';
import {
  careerProgressApi,
  type CareerProgressRecord,
} from '@/app/lib/career-progress/api';
import { trackEvent } from '@/app/lib/analytics/track';
import {
  TodayReminderCard,
  type TodayReminder,
} from './components/TodayReminderCard';
import { ContinueLastCard } from './components/ContinueLastCard';
import { RecentRecords } from './components/RecentRecords';
import { CareerTaskCard } from './components/CareerTaskCard';

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

type FocusKey = 'career' | 'relationship' | 'wealth' | 'self' | 'year';

const BAZI_ENTRIES: Array<{ key: FocusKey; label: string; hint: string; icon: typeof BriefcaseBusiness; href?: string }> = [
  { key: 'career', label: '事业阶段', hint: '看长期方向与当下节奏', icon: BriefcaseBusiness, href: '/career' },
  { key: 'relationship', label: '感情模式', hint: '看关系里的重复倾向', icon: Heart },
  { key: 'wealth', label: '财运节奏', hint: '看资源流动与取舍', icon: WalletCards },
  { key: 'self', label: '个人优势', hint: '看天性、能力与适合位置', icon: Sparkles },
  { key: 'year', label: '流年提醒', hint: '看这一阶段的重点', icon: CalendarDays },
];

const LIUYAO_ENTRIES = [
  '这个 offer 要不要接',
  '这段关系要不要推进',
  '这次合作有没有风险',
  '这个房子或工位是否合适',
  '最近这件事能不能成',
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

function latestCareerTaskFromHistory(data: DashboardData): CareerTaskContext | null {
  const tasks = [
    ...data.baziItems.map((item) => item.task_context),
    ...data.liuyaoItems.map((item) => item.task_context),
  ].filter((task): task is CareerTaskContext => task?.taskType === 'career');

  if (!tasks.length) return null;
  return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
}

function latestCareerTaskFromProgress(record: CareerProgressRecord | null): CareerTaskContext | null {
  return record?.task_context?.taskType === 'career' ? record.task_context : null;
}

function pickNewerCareerTask(
  current: CareerTaskContext | null,
  candidate: CareerTaskContext | null,
): CareerTaskContext | null {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate.updatedAt).getTime() >= new Date(current.updatedAt).getTime()
    ? candidate
    : current;
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
  const [careerTask, setCareerTask] = useState<CareerTaskContext | null>(null);
  const [todayReminder, setTodayReminder] = useState<TodayReminder | null>(null);

  useEffect(() => {
    if (routeLoading) return;
    let alive = true;
    const localCareerTask = loadCareerTaskContext();
    setCareerTask(localCareerTask);
    trackEvent('dashboard_view', {
      payload: {
        has_local_career_task: Boolean(localCareerTask),
      },
    });

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

      careerProgressApi.getLatest()
        .then((record) => {
          if (!alive) return;
          const latestProgressTask = latestCareerTaskFromProgress(record);
          if (latestProgressTask) {
            saveCareerTaskContext(latestProgressTask);
          }
          setCareerTask((current) => pickNewerCareerTask(current, latestProgressTask));
        })
        .catch(() => {
          if (alive) setCareerTask((current) => current ?? localCareerTask);
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
  const serverCareerTask = useMemo(() => latestCareerTaskFromHistory(data), [data]);
  const activeCareerTask = useMemo(() => {
    return pickNewerCareerTask(careerTask, serverCareerTask);
  }, [careerTask, serverCareerTask]);
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
              八字看长期趋势，六爻看具体事项。这里先帮你把入口排好。
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

        <TodayReminderCard reminder={todayReminder} />

        <section className="grid gap-5">
          <ContinueLastCard latest={latest} loading={historyLoading} />
        </section>

        <section className="mt-5 border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                <BriefcaseBusiness className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
                开始一个新分析
              </div>
              <h2 className="font-serif text-[1.35rem] font-medium leading-snug text-[var(--color-text-primary)]">
                工作或事业选择，先分清问题类型
              </h2>
              <p className="mt-3 max-w-[52ch] text-[16px] leading-7 text-[var(--color-text-body)]">
                先判断你是在看长期方向，还是在判断一个具体机会。长期趋势用八字，具体一事用六爻。
              </p>
            </div>
            <div className="grid gap-3">
              <CareerTaskCard task={activeCareerTask} onTaskUpdate={setCareerTask} />

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-stretch">
                <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">看长期方向</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">适合事业阶段、岗位类型、进取或稳定。</p>
                </div>
                <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">判断具体选择</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">适合 offer、合作、跳槽时机等具体事项。</p>
                </div>
                <Link
                  href="/career"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] sm:min-w-[120px]"
                >
                  开始分诊
                  <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">长期趋势，用八字</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">适合看阶段、模式和长期方向。</p>
              </div>
              <MessageSquare className="h-5 w-5 text-[var(--color-text-muted)]" strokeWidth={1.6} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {BAZI_ENTRIES.map(({ label, hint, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href || '/panel'}
                  className="group min-h-[72px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                    <Icon className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
                    {label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{hint}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">具体一事，用六爻</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">适合判断能不能成、该不该动、风险在哪里。</p>
              </div>
              <Dices className="h-5 w-5 text-[var(--color-text-muted)]" strokeWidth={1.6} />
            </div>
            <div className="space-y-2">
              {LIUYAO_ENTRIES.map((label) => (
                <Link
                  key={label}
                  href="/liuyao"
                  className="flex min-h-11 items-center justify-between gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
                >
                  <span>{label}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={1.6} />
                </Link>
              ))}
            </div>
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
