'use client';

import { useEffect, useState } from 'react';
import { emotionApi, WeeklyChart } from '@/app/lib/emotion/api';
import { useUser } from '@/app/lib/auth';
import DialogFlow from './components/DialogFlow';
import CharacterProfileView from './components/CharacterProfileView';

export default function XinjiPage() {
  const { user } = useUser();
  const [weeklyData, setWeeklyData] = useState<WeeklyChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
  });
  const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f8f6f1]">
      {/* Textured background with ink wash effect */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Flowing gradient overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-radial from-slate-200/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-radial from-stone-300/20 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header with calligraphic feel */}
        <header className="mb-16 text-center">
          <div className="inline-block relative">
            <h1 className="text-6xl font-serif text-slate-800 mb-3 tracking-wide relative">
              心镜灯
              <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
            </h1>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-slate-600">
            <span className="text-sm font-light tracking-widest">{dateStr}</span>
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span className="text-sm font-light">{weekday}</span>
          </div>
        </header>

        {/* Main hero section - asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Left: Main action card */}
          <div className="lg:col-span-3">
            <div className="relative group">
              {/* Decorative corner elements */}
              <div className="absolute -top-3 -left-3 w-24 h-24 border-l-2 border-t-2 border-slate-300 opacity-60" />
              <div className="absolute -bottom-3 -right-3 w-24 h-24 border-r-2 border-b-2 border-slate-300 opacity-60" />

              <div className="relative bg-white/80 backdrop-blur-sm rounded-none p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                <div className="flex flex-col items-start gap-6">
                  <div className="text-7xl opacity-20 group-hover:opacity-30 transition-opacity">📖</div>

                  <div>
                    <h2 className="text-3xl font-serif text-slate-800 mb-3">
                      今日心迹
                    </h2>
                    <p className="text-slate-600 text-lg font-light leading-relaxed">
                      记录此刻的感受，与内心对话
                    </p>
                  </div>

                  {user ? (
                    <button
                      onClick={() => setShowDialog(true)}
                      className="mt-4 group/btn relative overflow-hidden px-8 py-4 bg-slate-800 text-white text-lg font-light tracking-wide transition-all duration-300 hover:bg-slate-900 hover:tracking-wider"
                    >
                      <span className="relative z-10">开始记录</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    </button>
                  ) : (
                    <div className="mt-4 text-slate-500 font-light">
                      请先登录以使用心镜灯功能
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Weekly chart with vertical orientation */}
          {user && weeklyData && (
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-slate-50 to-stone-50 rounded-none p-8 h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-serif text-slate-800 mb-6 tracking-wide">一周情绪</h3>

                <div className="flex items-end justify-between h-64 gap-3">
                  {weeklyData.dates.map((date, index) => {
                    const score = weeklyData.scores[index];
                    const height = score ? `${score * 10}%` : '0%';
                    const dayLabel = new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' });
                    const isToday = new Date(date).toDateString() === today.toDateString();

                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-3 group/bar">
                        <div className="w-full bg-slate-200/50 rounded-sm relative overflow-hidden" style={{ height: '100%' }}>
                          {score && (
                            <>
                              <div
                                className="absolute bottom-0 w-full bg-gradient-to-t from-slate-700 via-slate-600 to-slate-500 transition-all duration-700 ease-out group-hover/bar:from-slate-800"
                                style={{
                                  height,
                                  animationDelay: `${index * 100}ms`
                                }}
                              />
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-700 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                {score}
                              </span>
                            </>
                          )}
                        </div>
                        <span className={`text-xs tracking-wider ${isToday ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                          {dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                  <span className="text-sm text-slate-600 font-light">平均</span>
                  <span className="ml-2 text-2xl font-serif text-slate-800">{weeklyData.average_score.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature grid - staggered layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            onClick={() => user && setShowDialog(true)}
            className="group relative bg-white/60 backdrop-blur-sm p-8 cursor-pointer transition-all duration-500 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1"
            style={{ animationDelay: '0ms' }}
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl mb-4 opacity-40 group-hover:opacity-60 transition-opacity">🌱</div>
            <h3 className="font-serif text-lg text-slate-800 mb-2 tracking-wide">今日心迹</h3>
            <p className="text-sm text-slate-600 font-light leading-relaxed">记录当下的感受和情绪</p>
          </div>

          <div className="group relative bg-white/40 backdrop-blur-sm p-8 opacity-50 cursor-not-allowed">
            <div className="text-4xl mb-4 opacity-30">💭</div>
            <h3 className="font-serif text-lg text-slate-800 mb-2 tracking-wide">深度对话</h3>
            <p className="text-sm text-slate-600 font-light leading-relaxed">与内心深入交流</p>
            <span className="absolute top-4 right-4 text-xs text-slate-400 tracking-wider">开发中</span>
          </div>

          <div
            onClick={() => user && setShowProfile(true)}
            className="group relative bg-white/60 backdrop-blur-sm p-8 cursor-pointer transition-all duration-500 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1"
            style={{ animationDelay: '100ms' }}
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl mb-4 opacity-40 group-hover:opacity-60 transition-opacity">🎭</div>
            <h3 className="font-serif text-lg text-slate-800 mb-2 tracking-wide">性格档案</h3>
            <p className="text-sm text-slate-600 font-light leading-relaxed">了解你的五行性格</p>
          </div>

          <div className="group relative bg-white/40 backdrop-blur-sm p-8 opacity-50 cursor-not-allowed">
            <div className="text-4xl mb-4 opacity-30">✨</div>
            <h3 className="font-serif text-lg text-slate-800 mb-2 tracking-wide">例外时刻</h3>
            <p className="text-sm text-slate-600 font-light leading-relaxed">记录积极的例外事件</p>
            <span className="absolute top-4 right-4 text-xs text-slate-400 tracking-wider">开发中</span>
          </div>
        </div>

        {/* Bottom action card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group relative bg-gradient-to-br from-slate-100 to-stone-100 p-8 opacity-50 cursor-not-allowed overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-full blur-3xl opacity-50" />
            <div className="relative">
              <div className="text-4xl mb-4 opacity-30">🎯</div>
              <h3 className="font-serif text-lg text-slate-800 mb-2 tracking-wide">价值行动</h3>
              <p className="text-sm text-slate-600 font-light leading-relaxed">制定并追踪行动计划</p>
              <span className="absolute top-0 right-0 text-xs text-slate-400 tracking-wider">开发中</span>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 p-8 text-white overflow-hidden group cursor-pointer hover:from-slate-900 hover:to-slate-800 transition-all duration-500">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="text-4xl mb-4 opacity-60">📚</div>
              <h3 className="font-serif text-lg mb-2 tracking-wide">历史记录</h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">查看过往的情绪轨迹</p>
              <div className="mt-4 text-xs text-slate-400 tracking-wider">即将推出</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog modals */}
      {showDialog && (
        <DialogFlow
          onComplete={() => {
            setShowDialog(false);
            loadWeeklyChart();
          }}
          onCancel={() => setShowDialog(false)}
        />
      )}

      {showProfile && (
        <CharacterProfileView onClose={() => setShowProfile(false)} />
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .group:hover .group-hover\\:opacity-100 {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
