'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  Clock3,
  Compass,
  Dices,
  FileText,
  Heart,
  History,
  Loader2,
  MessageSquare,
  Moon,
  RefreshCw,
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

const BAZI_ENTRIES: Array<{ key: FocusKey; label: string; hint: string; icon: typeof BriefcaseBusiness }> = [
  { key: 'career', label: '事业阶段', hint: '看长期方向与当下节奏', icon: BriefcaseBusiness },
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

function conversationHref(item: ConversationListItem, type: HistoryType) {
  return type === 'bazi' ? `/chat?conv_id=${item.id}` : `/liuyao?conv_id=${item.id}`;
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

function previewText(item: ConversationListItem, fallback: string) {
  return item.last_user_message || item.last_assistant_preview || fallback;
}

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

function inferFocus(data: DashboardData): { label: string; sentence: string } {
  const latest = latestConversation(data);
  const text = latest ? `${latest.item.last_user_message || ''}${latest.item.title || ''}` : '';
  if (/感情|关系|复合|分手|对象|伴侣|回复/.test(text)) {
    return { label: '关系', sentence: '今天适合把话说轻一点，把观察放具体一点。' };
  }
  if (/财|钱|收入|投资|合作|资源/.test(text)) {
    return { label: '资源', sentence: '今天适合核对资源与承诺，不急着把选择一次定死。' };
  }
  if (/工作|事业|offer|跳槽|岗位|创业/.test(text)) {
    return { label: '事业', sentence: '今天适合整理机会，先看清条件，再决定推进速度。' };
  }
  return { label: '节律', sentence: '今天不一定要推进很多，但适合先把心里乱的部分理顺。' };
}

function displayTitle(item: ConversationListItem, type: HistoryType) {
  if (type === 'bazi') return item.bazi_summary ? `八字 · ${item.bazi_summary}` : item.title || '八字解读';
  return item.hexagram?.main_gua ? `六爻 · ${item.hexagram.main_gua}` : item.title || '六爻问事';
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

function EmptyRecent() {
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]">
        <History className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <h2 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">还没有解读记录</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
        可以先从八字看长期趋势，或用六爻问一件具体事。记录会在这里形成回访入口。
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const routeLoading = useRouteGuard(true, true);
  const [data, setData] = useState<DashboardData>({ profile: null, baziItems: [], liuyaoItems: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routeLoading) return;
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [profileResp, bazi, liuyao] = await Promise.all([
          fetch(api('/profile/me'), { headers, credentials: 'include' }),
          historyApi.list('bazi', 0, 4),
          historyApi.list('liuyao', 0, 4),
        ]);

        if (!profileResp.ok) throw new Error('档案加载失败');
        const profile = await profileResp.json();
        if (!alive) return;
        setData({
          profile,
          baziItems: bazi.items,
          liuyaoItems: liuyao.items,
        });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : '命理首页加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => { alive = false; };
  }, [routeLoading]);

  const latest = useMemo(() => latestConversation(data), [data]);
  const focus = useMemo(() => inferFocus(data), [data]);
  const dayMaster = getDayMaster(data.profile);
  const recentItems = useMemo(
    () => [
      ...data.baziItems.map((item) => ({ item, type: 'bazi' as const })),
      ...data.liuyaoItems.map((item) => ({ item, type: 'liuyao' as const })),
    ].sort((a, b) => new Date(b.item.updated_at).getTime() - new Date(a.item.updated_at).getTime()).slice(0, 5),
    [data.baziItems, data.liuyaoItems],
  );

  if (routeLoading || loading) return <LoadingView />;

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
            ) : (
              <div>已读取你的默认档案</div>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-5 border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 px-4 py-3 text-sm text-[var(--color-primary-deeper)]">
            {error}
          </div>
        )}

        <section className="mb-4 border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                <Clock3 className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
                今日八字提示
              </div>
              <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">今日主题</p>
              <h2 className="mt-2 font-serif text-2xl font-medium leading-snug text-[var(--color-text-primary)] sm:text-[1.65rem]">
                {focus.label === '节律' ? '先整理，再行动' : `${focus.label}与节奏`}
              </h2>
              <p className="mt-3 max-w-[42ch] text-[16px] leading-7 text-[var(--color-text-body)]">
                {focus.sentence}
              </p>
            </div>

            <div className="grid gap-px border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3">
              <div className="bg-[var(--color-bg)] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]">
                  <Sparkles className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">今日适合</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-body)]">梳理计划、补充资料、低压力沟通</p>
              </div>
              <div className="bg-[var(--color-bg)] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]">
                  <Moon className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">今日少做</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-body)]">冲动承诺、情绪化判断、一次定死</p>
              </div>
              <div className="bg-[var(--color-primary)]/5 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-primary)]/25 text-[var(--color-primary)]">
                  <CalendarDays className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-text-muted)]">今日提醒</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-body)]">先把心里乱的部分理顺，再决定下一步。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {latest ? (
            <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                  <RefreshCw className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.6} />
                  继续上次的问题
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">{formatRelative(latest.item.updated_at)}</span>
              </div>
              <h2 className="font-serif text-xl font-medium leading-snug text-[var(--color-text-primary)]">
                {displayTitle(latest.item, latest.type)}
              </h2>
              <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[var(--color-text-body)]">
                {previewText(latest.item, latest.type === 'bazi' ? '上次的八字解读' : '上次的六爻问事')}
              </p>
              {latest.item.last_assistant_preview && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                  当前结论：{latest.item.last_assistant_preview}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={conversationHref(latest.item, latest.type)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
                >
                  继续分析
                  <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </Link>
                <Link
                  href="/history"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
                >
                  查看上次结论
                </Link>
              </div>
            </div>
          ) : (
            <EmptyRecent />
          )}
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
              {BAZI_ENTRIES.map(({ label, hint, icon: Icon }) => (
                <Link
                  key={label}
                  href="/panel"
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

        <section className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-medium text-[var(--color-text-primary)]">最近解读记录</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">回看过往判断，也可以从记录里继续追问。</p>
            </div>
            <Link
              href="/history"
              className="inline-flex min-h-11 items-center gap-2 rounded-[3px] px-3 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
            >
              全部记录
              <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
            </Link>
          </div>

          {recentItems.length ? (
            <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {recentItems.map(({ item, type }) => {
                const Icon = type === 'bazi' ? FileText : Compass;
                return (
                  <Link
                    key={`${type}-${item.id}`}
                    href={conversationHref(item, type)}
                    className="grid min-h-[76px] gap-2 py-3 transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[rgba(181,68,52,0.12)] sm:grid-cols-[1fr_auto] sm:items-center sm:px-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.6} />
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                          {displayTitle(item, type)}
                        </p>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-[var(--color-text-secondary)]">
                        {previewText(item, type === 'bazi' ? '八字解读记录' : item.hexagram?.question || '六爻问事记录')}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatRelative(item.updated_at)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-sm leading-6 text-[var(--color-text-secondary)]">
              还没有记录。你可以先从上面的八字或六爻入口开始。
            </div>
          )}
        </section>

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
