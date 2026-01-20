'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  UserPlus,
  MessageCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { api, postJSON } from '@/app/lib/api';
import { trySSE } from '@/app/lib/chat/sse';
import Markdown from '@/app/components/Markdown';
import WuxingRadar from '@/app/components/charts/WuxingRadar';

// Types
interface FourPillars {
  year: string[];
  month: string[];
  day: string[];
  hour: string[];
}

interface DayunItem {
  age: number;
  start_year: number;
  pillar: string[];
}

interface Paipan {
  four_pillars: FourPillars;
  dayun: DayunItem[];
}

// 五行映射
const WUXING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水',
};

function getWuxingFromPaipan(paipan: Paipan | null) {
  if (!paipan) return undefined;

  const counts: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const pillars = [
    paipan.four_pillars.year,
    paipan.four_pillars.month,
    paipan.four_pillars.day,
    paipan.four_pillars.hour,
  ];

  pillars.forEach(pillar => {
    pillar.forEach(char => {
      const wx = WUXING_MAP[char];
      if (wx) counts[wx]++;
    });
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts).map(([element, count]) => ({
    element,
    value: Math.round((count / total) * 100),
    fullMark: 100,
  }));
}

function TryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [paipan, setPaipan] = useState<Paipan | null>(null);
  const [aiContent, setAiContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const hasStartedRef = useRef(false);

  const startAnalysis = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const gender = searchParams.get('gender') || '男';
    const calendar = searchParams.get('calendar') || 'gregorian';
    const birthDate = searchParams.get('birth_date');
    const birthTime = searchParams.get('birth_time');
    const birthplace = searchParams.get('birthplace') || '';

    if (!birthDate || !birthTime) {
      setError('缺少出生日期或时间参数');
      return;
    }

    try {
      // 1. Calculate Paipan
      const paipanRes = await postJSON<{ mingpan: Paipan }>(api('/bazi/calc_paipan'), {
        gender,
        calendar,
        birth_date: birthDate,
        birth_time: birthTime,
        birthplace,
        birthplace_provided: !!birthplace.trim(),
      });

      if (!paipanRes?.mingpan) {
        throw new Error('命盘计算失败');
      }

      setPaipan(paipanRes.mingpan);

      // 2. Start AI Analysis
      setIsStreaming(true);
      abortRef.current = new AbortController();

      await trySSE(
        api('/chat/start'),
        {
          paipan: {
            gender,
            four_pillars: paipanRes.mingpan.four_pillars,
            dayun: paipanRes.mingpan.dayun,
          },
        },
        (text) => {
          setAiContent(text);
        },
        undefined,
        { signal: abortRef.current.signal }
      );

      setIsStreaming(false);
      // Show register modal after streaming completes
      setTimeout(() => setShowRegisterModal(true), 2000);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message || '分析失败，请重试');
      }
      setIsStreaming(false);
    }
  }, [searchParams]);

  useEffect(() => {
    startAnalysis();

    return () => {
      abortRef.current?.abort();
    };
  }, [startAnalysis]);

  const wuxingData = getWuxingFromPaipan(paipan);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            出错了
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <Link href="/" className="btn btn-primary">
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Top Banner */}
      <div className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 sm:gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">返回首页</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
            <span className="text-[var(--color-text-muted)]">免费体验版</span>
          </div>
          <Link
            href="/register"
            className="btn btn-secondary text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-4"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">注册账号</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Dashboard Section */}
        <section className="mb-6 sm:mb-8">
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Four Pillars Card */}
            <div className="lg:col-span-2 card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-gold)] mb-3 sm:mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="w-1 h-5 bg-[var(--color-gold)] rounded-full" />
                四柱命盘
              </h2>

              {paipan ? (
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  {(['year', 'month', 'day', 'hour'] as const).map((key, idx) => {
                    const labels = ['年柱', '月柱', '日柱', '时柱'];
                    const pillar = paipan.four_pillars[key];
                    return (
                      <div key={key} className="text-center">
                        <div className="text-xs text-[var(--color-text-muted)] mb-1 sm:mb-2">{labels[idx]}</div>
                        <div className="space-y-1 sm:space-y-2">
                          <PillarChar char={pillar[0]} />
                          <PillarChar char={pillar[1]} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="text-center">
                      <div className="h-4 w-8 mx-auto mb-1 sm:mb-2 bg-[var(--color-bg-hover)] rounded animate-pulse" />
                      <div className="space-y-1 sm:space-y-2">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto bg-[var(--color-bg-hover)] rounded-xl animate-pulse" />
                        <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto bg-[var(--color-bg-hover)] rounded-xl animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dayun Timeline */}
              {paipan && paipan.dayun && paipan.dayun.length > 0 && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[var(--color-border)]">
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 sm:mb-4">大运流年</h3>
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                    {paipan.dayun.slice(0, 8).map((dy, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 text-center p-2 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] min-w-[60px] sm:min-w-[80px]"
                      >
                        <div className="text-xs text-[var(--color-text-hint)] mb-1">{dy.age}岁起</div>
                        <div className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)]">
                          {dy.pillar[0]}{dy.pillar[1]}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-1">{dy.start_year}年</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wuxing Radar Card */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-gold)] mb-3 sm:mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="w-1 h-5 bg-[var(--color-gold)] rounded-full" />
                五行分布
              </h2>
              <WuxingRadar data={wuxingData} />
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                {['木', '火', '土', '金', '水'].map(wx => (
                  <span key={wx} className={`wuxing-badge wuxing-${wx === '木' ? 'wood' : wx === '火' ? 'fire' : wx === '土' ? 'earth' : wx === '金' ? 'metal' : 'water'}`}>
                    {wx}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Analysis Section */}
        <section className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--color-gold)] mb-3 sm:mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="w-1 h-5 bg-[var(--color-gold)] rounded-full" />
            AI 命理解读
            {isStreaming && (
              <span className="ml-2 flex items-center gap-1 text-sm font-normal text-[var(--color-text-muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                分析中...
              </span>
            )}
          </h2>

          <div className="msg-md min-h-[150px] sm:min-h-[200px]">
            {aiContent ? (
              <Markdown>{aiContent}</Markdown>
            ) : (
              <div className="space-y-3">
                <div className="h-4 bg-[var(--color-bg-hover)] rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-[var(--color-bg-hover)] rounded w-full animate-pulse" />
                <div className="h-4 bg-[var(--color-bg-hover)] rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-[var(--color-bg-hover)] rounded w-2/3 animate-pulse" />
              </div>
            )}
          </div>

          {/* CTA after content */}
          {!isStreaming && aiContent && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[var(--color-border)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                    想要继续提问或保存解读记录？
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                    注册账号解锁完整功能
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Link href="/register" className="btn btn-primary text-sm sm:text-base">
                    <UserPlus className="w-4 h-4" />
                    注册账号
                  </Link>
                  <Link href="/login" className="btn btn-secondary text-sm sm:text-base">
                    已有账号？登录
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRegisterModal(false)}
          />
          <div className="relative card p-6 sm:p-8 max-w-md w-full animate-scale-in">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                解读完成
              </h3>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-4 sm:mb-6">
                注册账号即可保存记录、继续提问、获取更多深度分析
              </p>
              <div className="space-y-2 sm:space-y-3">
                <Link href="/register" className="btn btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  免费注册
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link href="/login" className="btn btn-ghost w-full py-2.5 sm:py-3 text-sm sm:text-base">
                  已有账号？立即登录
                </Link>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-xs sm:text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  稍后再说
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Pillar Character Component
function PillarChar({ char }: { char: string }) {
  const wuxing = WUXING_MAP[char];
  const colorClass = wuxing === '木' ? 'wuxing-wood'
    : wuxing === '火' ? 'wuxing-fire'
    : wuxing === '土' ? 'wuxing-earth'
    : wuxing === '金' ? 'wuxing-metal'
    : wuxing === '水' ? 'wuxing-water'
    : '';

  return (
    <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl flex flex-col items-center justify-center ${colorClass}`}>
      <span className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        {char}
      </span>
      {wuxing && (
        <span className="text-xs opacity-70">{wuxing}</span>
      )}
    </div>
  );
}

export default function TryPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">加载中...</p>
        </div>
      </main>
    }>
      <TryPageContent />
    </Suspense>
  );
}
