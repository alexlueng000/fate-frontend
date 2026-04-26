'use client';

import { useEffect, useState } from 'react';
import { emotionApi, CharacterProfile } from '@/app/lib/emotion/api';

const WUXING_COLORS: Record<string, { primary: string; secondary: string; gradient: string }> = {
  '木': {
    primary: 'text-emerald-700',
    secondary: 'bg-emerald-50',
    gradient: 'from-emerald-100 to-green-50'
  },
  '火': {
    primary: 'text-rose-700',
    secondary: 'bg-rose-50',
    gradient: 'from-rose-100 to-red-50'
  },
  '土': {
    primary: 'text-amber-700',
    secondary: 'bg-amber-50',
    gradient: 'from-amber-100 to-yellow-50'
  },
  '金': {
    primary: 'text-slate-700',
    secondary: 'bg-slate-50',
    gradient: 'from-slate-100 to-gray-50'
  },
  '水': {
    primary: 'text-cyan-700',
    secondary: 'bg-cyan-50',
    gradient: 'from-cyan-100 to-blue-50'
  },
};

const WUXING_ICONS: Record<string, string> = {
  '木': '🌳',
  '火': '🔥',
  '土': '🏔️',
  '金': '⚔️',
  '水': '💧',
};

const WUXING_DESCRIPTIONS: Record<string, string> = {
  '木': '如树木般生长，向上而有韧性',
  '火': '如火焰般热烈，明亮而温暖',
  '土': '如大地般稳重，承载而包容',
  '金': '如金属般坚定，锋利而果断',
  '水': '如流水般灵动，柔软而深邃',
};

interface CharacterProfileViewProps {
  onClose: () => void;
}

export default function CharacterProfileView({ onClose }: CharacterProfileViewProps) {
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await emotionApi.getCharacterProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载失败，请先完成八字测算');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-[#f8f6f1] p-12 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            <div className="text-slate-600 font-light tracking-wide">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-[#f8f6f1] p-12 max-w-md shadow-2xl">
          <div className="text-center space-y-6">
            <div className="text-6xl opacity-30">⚠️</div>
            <p className="text-slate-700 font-light text-lg leading-relaxed">{error}</p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-slate-800 text-white font-light tracking-wide hover:bg-slate-900 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const colors = WUXING_COLORS[profile.element] || WUXING_COLORS['金'];
  const icon = WUXING_ICONS[profile.element] || '⭐';
  const description = WUXING_DESCRIPTIONS[profile.element] || '';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#f8f6f1] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Decorative header line */}
        <div className="relative h-2 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />

        {/* Hero section */}
        <div className={`relative bg-gradient-to-br ${colors.gradient} p-12 overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

          <div className="relative flex justify-between items-start">
            <div className="space-y-4">
              <div className="text-7xl opacity-60">{icon}</div>
              <div>
                <h2 className="text-4xl font-serif text-slate-800 tracking-wide mb-2">
                  {profile.element}
                </h2>
                <p className="text-slate-700 font-light text-lg italic">
                  {description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 text-3xl font-light transition-colors leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-12 space-y-8">
          {/* Five Elements Balance - Radial visualization */}
          <div className="space-y-6">
            <h3 className="text-2xl font-serif text-slate-800 tracking-wide">五行平衡</h3>

            <div className="grid grid-cols-5 gap-4">
              {Object.entries(profile.wuxing_balance.wuxing_count).map(([element, count]) => {
                const elementColors = WUXING_COLORS[element] || WUXING_COLORS['金'];
                const percentage = (count / 8) * 100;

                return (
                  <div key={element} className="flex flex-col items-center gap-3">
                    <div className="relative w-20 h-20">
                      {/* Background circle */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-slate-200"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className={elementColors.primary}
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${2 * Math.PI * 35 * (1 - percentage / 100)}`}
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-serif text-slate-800">{count}</span>
                      </div>
                    </div>
                    <span className="text-sm text-slate-600 font-light">{element}</span>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-4 border-t border-slate-200">
              <span className="text-sm text-slate-500 font-light">平衡分数</span>
              <span className="ml-3 text-3xl font-serif text-slate-800">
                {profile.wuxing_balance.balance_score}
              </span>
              <span className="text-slate-500 font-light"> / 100</span>
            </div>
          </div>

          {/* Traits - Two column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive traits */}
            <div className="space-y-4">
              <h3 className="text-xl font-serif text-slate-800 tracking-wide flex items-center gap-2">
                <span className="text-2xl">✨</span>
                性格优势
              </h3>
              <div className="space-y-2">
                {profile.positive_traits.map((trait, index) => (
                  <div
                    key={trait}
                    className="flex items-center gap-3 animate-slideIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-1 h-8 bg-emerald-400" />
                    <span className="text-slate-700 font-light">{trait}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Negative traits */}
            <div className="space-y-4">
              <h3 className="text-xl font-serif text-slate-800 tracking-wide flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                需要注意
              </h3>
              <div className="space-y-2">
                {profile.negative_traits.map((trait, index) => (
                  <div
                    key={trait}
                    className="flex items-center gap-3 animate-slideIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-1 h-8 bg-amber-400" />
                    <span className="text-slate-700 font-light">{trait}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emotion tendency - Quote style */}
          <div className="relative py-8">
            <div className="absolute top-0 left-0 text-6xl text-slate-300 font-serif leading-none">"</div>
            <div className="pl-12 pr-8">
              <h3 className="text-xl font-serif text-slate-800 tracking-wide mb-4">情绪倾向</h3>
              <p className="text-slate-700 font-light text-lg leading-relaxed italic">
                {profile.emotion_tendency}
              </p>
            </div>
            <div className="absolute bottom-0 right-0 text-6xl text-slate-300 font-serif leading-none">"</div>
          </div>

          {/* Advice - Highlighted section */}
          <div className="relative bg-gradient-to-br from-slate-100 to-stone-100 p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-full blur-3xl opacity-50" />
            <div className="relative space-y-4">
              <h3 className="text-xl font-serif text-slate-800 tracking-wide flex items-center gap-2">
                <span className="text-2xl">💡</span>
                给你的建议
              </h3>
              <p className="text-slate-700 font-light text-lg leading-relaxed">
                {profile.advice}
              </p>
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={onClose}
              className="px-12 py-4 bg-slate-800 text-white font-light tracking-wide hover:bg-slate-900 transition-all hover:tracking-wider"
            >
              知道了
            </button>
          </div>
        </div>

        {/* Decorative footer line */}
        <div className="relative h-2 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
