'use client';

import { useEffect, useState } from 'react';
import { BookOpen, MessageCircle, User, Sparkles, Target, Archive } from 'lucide-react';
import { emotionApi, WeeklyChart, EmotionRecord } from '@/app/lib/emotion/api';
import { useUser } from '@/app/lib/auth';
import DialogFlow from './components/DialogFlow';
import CharacterProfileView from './components/CharacterProfileView';
import JieqiHeader from './components/JieqiHeader';
import PersonaCard from './components/PersonaCard';
import { useRouter } from 'next/navigation';

export default function XinjiPage() {
  const { user } = useUser();
  const router = useRouter();
  const [weeklyData, setWeeklyData] = useState<WeeklyChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadWeeklyChart();
    }
  }, [user]);

  const loadWeeklyChart = async () => {
    try {
      const data = await emotionApi.getWeeklyChart();
      setWeeklyData(data);
    } catch (error) {
      console.error('Failed to load weekly chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      const data = await emotionApi.getRecords(10, 0);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records:', error);
    }
  };

  const handleComplete = () => {
    setShowDialog(false);
    loadWeeklyChart();
    setSuccessMessage('记录已保存');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleShowHistory = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadRecords();
    setShowHistory(true);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  });
  const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Success message */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in"
        >
          <div className="bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] px-6 py-3 rounded-[4px] shadow-[var(--shadow-lg)] flex items-center gap-2">
            <BookOpen size={16} />
            {successMessage}
          </div>
        </div>
      )}

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header with calligraphic feel */}
        <header className="mb-10 text-center">
          <div className="inline-block relative">
            <h1 className="text-6xl font-[var(--font-display)] text-[var(--color-text-primary)] mb-3 tracking-wide relative">
              心镜灯
              <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
            </h1>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-[var(--color-text-secondary)]">
            <span className="text-sm font-light">{dateStr}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
            <span className="text-sm font-light">{weekday}</span>
          </div>
        </header>

        {/* 镜厅：节气·天色 + 天性小像 */}
        <main>
          <section className="mb-14 max-w-2xl mx-auto space-y-6">
            <JieqiHeader />
            {user && <PersonaCard />}
          </section>

          {/* Main hero section - asymmetric layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
            {/* Left: Main action card */}
            <div className="lg:col-span-3">
              <div className="relative bg-[var(--color-bg-card)] rounded-[4px] p-6 sm:p-12 border border-[var(--color-border)] shadow-[var(--shadow-md)] transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1">
                <div className="flex flex-col items-start gap-6">
                  <BookOpen
                    size={48}
                    strokeWidth={1.5}
                    className="text-[var(--color-text-muted)] opacity-40"
                  />

                  <div>
                    <h2 className="text-3xl font-[var(--font-display)] text-[var(--color-text-primary)] mb-3">
                      今日心迹
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-lg font-light leading-relaxed">
                      记录此刻的感受，与内心对话
                    </p>
                  </div>

                  {user ? (
                    <button
                      onClick={() => setShowDialog(true)}
                      className="mt-4 relative overflow-hidden px-8 py-4 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-lg font-light transition-all duration-300 hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-primary-glow)] rounded-[3px]"
                    >
                      开始记录
                    </button>
                  ) : (
                    <div className="mt-4 text-[var(--color-text-muted)] font-light">
                      请先登录以使用心镜灯功能
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Weekly chart with vertical orientation */}
            {user && weeklyData && (
              <div className="lg:col-span-2">
                <div
                  role="img"
                  aria-label={`一周情绪图表，平均分 ${weeklyData.average_score.toFixed(1)}`}
                  className="bg-[var(--color-bg-elevated)] rounded-[4px] p-8 h-full border border-[var(--color-border)] shadow-[var(--shadow-md)]"
                >
                  <h3 className="text-xl font-[var(--font-display)] text-[var(--color-text-primary)] mb-6">一周情绪</h3>

                  <div className="flex items-end justify-between h-48 sm:h-64 gap-3">
                    {weeklyData.dates.map((date, index) => {
                      const score = weeklyData.scores[index];
                      const height = score ? `${score * 10}%` : '0%';
                      const dayLabel = new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' });
                      const isToday = new Date(date).toDateString() === today.toDateString();

                      return (
                        <div key={date} className="flex-1 flex flex-col items-center gap-3 group/bar">
                          <div className="w-full bg-[var(--color-bg-hover)] rounded-[2px] relative overflow-hidden" style={{ height: '100%' }}>
                            {score && (
                              <>
                                <div
                                  className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--color-text-primary)] via-[var(--color-text-body)] to-[var(--color-text-secondary)] transition-all duration-700 ease-[var(--ease-out)]"
                                  style={{ height }}
                                />
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-medium text-[var(--color-text-body)] opacity-0 sm:opacity-100 sm:group-hover/bar:opacity-100 transition-opacity">
                                  {score}
                                </span>
                              </>
                            )}
                          </div>
                          <span className={`text-xs ${isToday ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-muted)]'}`}>
                            {dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center">
                    <span className="text-sm text-[var(--color-text-secondary)] font-light">平均</span>
                    <span className="ml-2 text-2xl font-[var(--font-display)] text-[var(--color-text-primary)]">{weeklyData.average_score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feature grid - redesigned with asymmetric layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Primary: Character Profile - larger card */}
            <div
              onClick={() => user && setShowProfile(true)}
              className={`lg:col-span-2 relative bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 ${user ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-1 rounded-[4px]`}
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-[4px] bg-[var(--color-mist)]/10 flex items-center justify-center">
                  <User size={24} strokeWidth={1.5} className="text-[var(--color-mist-deep)]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-[var(--font-display)] text-lg text-[var(--color-text-primary)] mb-2">性格档案</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] font-light leading-relaxed">了解你的五行性格，探索内在特质</p>
                </div>
              </div>
            </div>

            {/* Secondary: History - medium card */}
            <div
              onClick={handleShowHistory}
              className="relative bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-body)] p-8 text-[var(--color-text-inverse)] cursor-pointer hover:from-[var(--color-text-body)] hover:to-[var(--color-text-primary)] transition-all duration-300 rounded-[4px]"
            >
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-[4px] bg-[var(--color-bg-elevated)]/10 flex items-center justify-center">
                  <Archive size={24} strokeWidth={1.5} className="text-[var(--color-text-inverse)]" />
                </div>
                <div>
                  <h3 className="font-[var(--font-display)] text-lg mb-2">历史记录</h3>
                  <p className="text-sm text-[var(--color-text-inverse)]/80 font-light leading-relaxed">查看过往的情绪轨迹</p>
                </div>
              </div>
            </div>

            {/* Tertiary: Coming soon features - smaller cards */}
            <div className="relative bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6 opacity-50 cursor-not-allowed rounded-[4px]">
              <div className="flex items-start gap-4">
                <MessageCircle size={20} strokeWidth={1.5} className="text-[var(--color-text-muted)] flex-shrink-0" />
                <div>
                  <h3 className="font-[var(--font-display)] text-base text-[var(--color-text-primary)] mb-1">深度对话</h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-light">与内心深入交流</p>
                  <span className="inline-block mt-2 text-[10px] text-[var(--color-text-hint)] tracking-wider">开发中</span>
                </div>
              </div>
            </div>

            <div className="relative bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6 opacity-50 cursor-not-allowed rounded-[4px]">
              <div className="flex items-start gap-4">
                <Sparkles size={20} strokeWidth={1.5} className="text-[var(--color-text-muted)] flex-shrink-0" />
                <div>
                  <h3 className="font-[var(--font-display)] text-base text-[var(--color-text-primary)] mb-1">例外时刻</h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-light">记录积极的例外事件</p>
                  <span className="inline-block mt-2 text-[10px] text-[var(--color-text-hint)] tracking-wider">开发中</span>
                </div>
              </div>
            </div>

            <div className="relative bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6 opacity-50 cursor-not-allowed rounded-[4px]">
              <div className="flex items-start gap-4">
                <Target size={20} strokeWidth={1.5} className="text-[var(--color-text-muted)] flex-shrink-0" />
                <div>
                  <h3 className="font-[var(--font-display)] text-base text-[var(--color-text-primary)] mb-1">价值行动</h3>
                  <p className="text-xs text-[var(--color-text-muted)] font-light">制定并追踪行动计划</p>
                  <span className="inline-block mt-2 text-[10px] text-[var(--color-text-hint)] tracking-wider">开发中</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog modals */}
      {showDialog && (
        <DialogFlow
          onComplete={handleComplete}
          onCancel={() => setShowDialog(false)}
        />
      )}

      {showProfile && (
        <CharacterProfileView onClose={() => setShowProfile(false)} />
      )}

      {/* History modal */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-[var(--color-text-primary)]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-title"
        >
          <div className="bg-[var(--color-bg)] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[var(--shadow-lg)] flex flex-col rounded-[4px]">
            {/* Header */}
            <div className="relative border-b border-[var(--color-border)] p-6">
              <h2 id="history-title" className="text-2xl font-[var(--font-display)] text-[var(--color-text-primary)]">历史记录</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-primary-glow)] rounded-[3px]"
                aria-label="关闭历史记录"
              >
                ✕
              </button>
            </div>

            {/* Records list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {records.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  还没有记录，开始第一次吧
                </div>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    className="bg-[var(--color-bg-card)] p-6 border border-[var(--color-border)] hover:shadow-[var(--shadow-sm)] transition-shadow rounded-[4px]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border border-[var(--color-border)] flex items-center justify-center bg-[var(--color-bg-elevated)]">
                          <span className="text-xl font-[var(--font-display)] text-[var(--color-text-primary)]">{record.emotion_score}</span>
                        </div>
                        <div>
                          <div className="text-sm text-[var(--color-text-secondary)]">
                            {new Date(record.record_date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          {record.solar_term && (
                            <div className="text-xs text-[var(--color-text-muted)] mt-1">
                              {record.solar_term} · {record.wuxing_element}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {record.emotion_tags && record.emotion_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {record.emotion_tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[var(--color-text-body)] text-sm leading-relaxed whitespace-pre-wrap">
                      {record.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
