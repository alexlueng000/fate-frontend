'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, MessageCircle, Sparkles, Loader2, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

import { useRouteGuard } from '@/app/lib/useRouteGuard';
import {
  historyApi,
  type ConversationListItem,
  type HistoryType,
} from '@/app/lib/history/api';
import { trackEvent } from '@/app/lib/analytics/track';

const PAGE_SIZE = 20;

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffMs = now - d.getTime();
    const m = Math.floor(diffMs / 60_000);
    if (m < 1) return '刚刚';
    if (m < 60) return `${m} 分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时前`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days} 天前`;
    // 超过 7 天就显示绝对时间
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day} ${hour}:${min}`;
  } catch {
    return iso;
  }
}

function displayTitle(item: ConversationListItem, type: HistoryType): string {
  if (type === 'bazi') {
    if (item.title === '八字解读' && item.bazi_summary) {
      return `八字 · ${item.bazi_summary}`;
    }
    return item.title || '八字解读';
  }
  return item.title || '六爻问事';
}

function safePreview(text: string | null, fallback: string): string | null {
  if (!text) return null;
  const content = text.trim();
  if (!content) return null;

  if (content.startsWith('我的命盘信息如下')) return null;

  const leakMarkers = [
    'system prompt',
    '系统提示',
    '系统prompt',
    '需引导用户',
    '结合原局',
    '用子平和盲派深度分析',
    '请基于当前命盘',
    '本命盘锚点',
    '重要规则：',
  ];
  if (leakMarkers.some((marker) => content.includes(marker))) {
    return fallback;
  }

  return content;
}

export default function HistoryPage() {
  const router = useRouter();
  const loading = useRouteGuard(true, false);

  const [activeTab, setActiveTab] = useState<HistoryType>('bazi');
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [clearing, setClearing] = useState<'current' | 'all' | null>(null);

  // Tab counters (load both regardless of active tab so badges are accurate)
  const [counts, setCounts] = useState<{ bazi: number; liuyao: number }>({ bazi: 0, liuyao: 0 });

  const fetchList = useCallback(async (type: HistoryType, off: number) => {
    setFetching(true);
    setError(null);
    try {
      const data = await historyApi.list(type, off, PAGE_SIZE);
      setItems(data.items);
      setTotal(data.total);
      setOffset(off);
      setCounts((prev) => ({ ...prev, [type]: data.total }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setFetching(false);
    }
  }, []);

  // Initial load: also pre-fetch the other tab's count once
  useEffect(() => {
    if (loading) return;
    trackEvent('history_view', {
      payload: {
        active_tab: activeTab,
      },
    });
    fetchList(activeTab, 0);
  }, [loading, activeTab, fetchList]);

  useEffect(() => {
    if (loading) return;
    // 拉一次另一个 tab 的 count（首屏用），失败忽略
    const otherType: HistoryType = activeTab === 'bazi' ? 'liuyao' : 'bazi';
    historyApi.list(otherType, 0, 1)
      .then((d) => setCounts((prev) => ({ ...prev, [otherType]: d.total })))
      .catch(() => {});
  }, [loading, activeTab]);

  const handleTabChange = (tab: HistoryType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setItems([]);
    setOffset(0);
  };

  const handleOpen = (item: ConversationListItem) => {
    const path = activeTab === 'bazi' ? '/chat' : '/liuyao';
    trackEvent('conversation_continue_click', {
      payload: {
        type: activeTab,
        conversation_id: item.id,
        source: 'history_list',
      },
    });
    router.push(`${path}?conv_id=${item.id}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/panel');
  };

  const handleDelete = async (e: React.MouseEvent, item: ConversationListItem) => {
    e.stopPropagation();
    if (!window.confirm('确定删除这条记录？删除后将无法恢复。')) return;
    setDeleting(item.id);
    try {
      await historyApi.delete(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setTotal((t) => Math.max(0, t - 1));
      setCounts((prev) => ({ ...prev, [activeTab]: Math.max(0, prev[activeTab] - 1) }));
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const handleClearCurrent = async () => {
    if (total === 0 || clearing) return;
    const label = activeTab === 'bazi' ? '八字解读' : '六爻记录';
    if (!window.confirm(`确定清空所有${label}？此操作无法恢复。`)) return;

    setClearing('current');
    setError(null);
    try {
      await historyApi.clear(activeTab);
      setItems([]);
      setTotal(0);
      setOffset(0);
      setCounts((prev) => ({ ...prev, [activeTab]: 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空失败');
    } finally {
      setClearing(null);
    }
  };

  const handleClearAll = async () => {
    if ((counts.bazi + counts.liuyao) === 0 || clearing) return;
    if (!window.confirm('确定清空所有解读记录？八字和六爻记录都会删除，此操作无法恢复。')) return;

    setClearing('all');
    setError(null);
    try {
      await historyApi.clear('all');
      setItems([]);
      setTotal(0);
      setOffset(0);
      setCounts({ bazi: 0, liuyao: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空失败');
    } finally {
      setClearing(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const canPrev = offset > 0 && !fetching;
  const canNext = offset + PAGE_SIZE < total && !fetching;

  if (loading) {
    return (
      <main className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-neutral-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-12 bg-[#F7F3EE]">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <header className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-[3px] px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-white hover:text-[#a83232] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(168,50,50,0.12)]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            返回
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-800">我的解读记录</h1>
          <p className="text-sm text-neutral-500 mt-1">回顾过往解读，点击卡片继续追问</p>
        </header>

        {/* Tab 切换 */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex self-start rounded-full bg-white border border-neutral-200 p-1 shadow-sm">
            {(['bazi', 'liuyao'] as const).map((t) => {
              const active = activeTab === t;
              const label = t === 'bazi' ? '八字' : '六爻';
              const count = counts[t];
              return (
                <button
                  key={t}
                  onClick={() => handleTabChange(t)}
                  className={`px-5 py-1.5 text-sm rounded-full transition-all ${
                    active
                      ? 'bg-[#a83232] text-white shadow'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 inline-flex items-center justify-center text-[11px] px-1.5 rounded-full min-w-[18px] ${
                        active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleClearCurrent}
              disabled={total === 0 || clearing !== null}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[3px] border border-neutral-200 bg-white px-3 text-sm text-neutral-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {clearing === 'current' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              清空{activeTab === 'bazi' ? '八字' : '六爻'}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={(counts.bazi + counts.liuyao) === 0 || clearing !== null}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[3px] border border-red-200 bg-red-50 px-3 text-sm text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {clearing === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              清空全部
            </button>
          </div>
        </div>

        {/* 错误 */}
        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 列表 */}
        {fetching && items.length === 0 ? (
          <div className="rounded-2xl bg-white border border-neutral-200 p-10 text-center text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> 加载中…
          </div>
        ) : items.length === 0 ? (
          <EmptyState type={activeTab} onPrimary={() => router.push(activeTab === 'bazi' ? '/panel' : '/liuyao')} />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const userPreview = safePreview(item.last_user_message, activeTab === 'bazi' ? '快捷分析' : '六爻追问');
              const assistantPreview = safePreview(item.last_assistant_preview, activeTab === 'bazi' ? '八字解读记录' : '六爻解读记录');
              return (
                <li
                  key={item.id}
                  onClick={() => handleOpen(item)}
                  className="group cursor-pointer rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5 hover:border-[#a83232]/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        {activeTab === 'bazi' ? (
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <h2 className="text-base font-medium text-neutral-800 truncate">
                          {displayTitle(item, activeTab)}
                        </h2>
                      </div>

                      {/* 六爻：本卦 → 变卦 */}
                      {activeTab === 'liuyao' && item.hexagram && (
                        <div className="text-xs text-neutral-600 mb-1.5">
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200/60 mr-1.5">
                            {item.hexagram.main_gua || '—'}
                          </span>
                          {item.hexagram.change_gua && (
                            <>
                              <span className="text-neutral-400">→</span>
                              <span className="px-2 py-0.5 rounded bg-stone-50 border border-stone-200/60 ml-1.5">
                                {item.hexagram.change_gua}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* 最后消息预览 */}
                      {(userPreview || assistantPreview) && (
                        <div className="text-sm text-neutral-500 line-clamp-2 mb-1.5">
                          {userPreview ? (
                            <>
                              <span className="text-neutral-400">问：</span>
                              {userPreview}
                            </>
                          ) : (
                            assistantPreview
                          )}
                        </div>
                      )}

                      <div className="text-xs text-neutral-400">
                        {formatRelative(item.updated_at)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, item)}
                      disabled={deleting === item.id}
                      aria-label="删除"
                      className="shrink-0 p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deleting === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* 翻页 */}
        {total > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <button
              onClick={() => fetchList(activeTab, Math.max(0, offset - PAGE_SIZE))}
              disabled={!canPrev}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-[#a83232]/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> 上一页
            </button>
            <span className="text-neutral-500">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => fetchList(activeTab, offset + PAGE_SIZE)}
              disabled={!canNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-[#a83232]/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({ type, onPrimary }: { type: HistoryType; onPrimary: () => void }) {
  const isBazi = type === 'bazi';
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
        {isBazi ? (
          <Sparkles className="w-6 h-6 text-amber-600" />
        ) : (
          <MessageCircle className="w-6 h-6 text-amber-600" />
        )}
      </div>
      <h3 className="text-base font-medium text-neutral-800 mb-1">
        还没有{isBazi ? '八字' : '六爻'}解读记录
      </h3>
      <p className="text-sm text-neutral-500 mb-5">
        {isBazi ? '到面板里完成一次八字对话，记录会出现在这里' : '到六爻页起卦提问，记录会出现在这里'}
      </p>
      <button
        onClick={onPrimary}
        className="px-5 py-2 rounded-full bg-[#a83232] text-white text-sm hover:bg-[#8c2b2b] transition-colors"
      >
        {isBazi ? '前往八字面板' : '开始六爻问事'}
      </button>
    </div>
  );
}
