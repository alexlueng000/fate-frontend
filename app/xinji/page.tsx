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

  // 获取当前日期和节气信息
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-4xl mx-auto p-4 pt-8">
        {/* 顶部标题区 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">心镜灯</h1>
          <p className="text-gray-600">{dateStr}</p>
        </div>

        {/* 主功能卡片 */}
        <div className="card p-8 mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              今日心迹
            </h2>
            <p className="text-gray-600 mb-6">
              记录此刻的感受，与内心对话
            </p>

            {user ? (
              <button
                onClick={() => setShowDialog(true)}
                className="btn-primary px-8 py-3 text-lg"
              >
                开始记录
              </button>
            ) : (
              <div className="text-gray-500">
                请先登录以使用心镜灯功能
              </div>
            )}
          </div>
        </div>

        {/* 一周情绪图表 */}
        {user && weeklyData && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">一周情绪图</h3>
            <div className="flex items-end justify-between h-40 gap-2">
              {weeklyData.dates.map((date, index) => {
                const score = weeklyData.scores[index];
                const height = score ? `${score * 10}%` : '0%';
                const dayLabel = new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' });

                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '100%' }}>
                      {score && (
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t transition-all"
                          style={{ height }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-700">
                            {score}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              平均分：{weeklyData.average_score.toFixed(1)}
            </div>
          </div>
        )}

        {/* 功能入口 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => user && setShowDialog(true)}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-3">🌱</div>
            <h3 className="font-semibold text-gray-800 mb-2">今日心迹</h3>
            <p className="text-sm text-gray-600">记录当下的感受和情绪</p>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="text-3xl mb-3">💭</div>
            <h3 className="font-semibold text-gray-800 mb-2">深度对话</h3>
            <p className="text-sm text-gray-600">与内心深入交流（开发中）</p>
          </div>

          <div
            onClick={() => user && setShowProfile(true)}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-3">🎭</div>
            <h3 className="font-semibold text-gray-800 mb-2">性格档案</h3>
            <p className="text-sm text-gray-600">了解你的五行性格</p>
          </div>
        </div>

        {/* 例外时刻和价值行动入口 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-800 mb-2">例外时刻</h3>
            <p className="text-sm text-gray-600">记录积极的例外事件（开发中）</p>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-800 mb-2">价值行动</h3>
            <p className="text-sm text-gray-600">制定并追踪行动计划（开发中）</p>
          </div>
        </div>
      </div>

      {/* 对话流程弹窗 */}
      {showDialog && (
        <DialogFlow
          onComplete={() => {
            setShowDialog(false);
            loadWeeklyChart(); // 重新加载图表数据
          }}
          onCancel={() => setShowDialog(false)}
        />
      )}

      {/* 性格档案弹窗 */}
      {showProfile && (
        <CharacterProfileView onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
