'use client';

import { useEffect, useState } from 'react';
import { emotionApi, CharacterProfile } from '@/app/lib/emotion/api';

const WUXING_COLORS: Record<string, string> = {
  '木': 'text-green-600 bg-green-50',
  '火': 'text-red-600 bg-red-50',
  '土': 'text-yellow-600 bg-yellow-50',
  '金': 'text-gray-600 bg-gray-50',
  '水': 'text-blue-600 bg-blue-50',
};

const WUXING_ICONS: Record<string, string> = {
  '木': '🌳',
  '火': '🔥',
  '土': '🏔️',
  '金': '⚔️',
  '水': '💧',
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-6">{error}</p>
            <button onClick={onClose} className="btn-primary px-6 py-2">
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const colorClass = WUXING_COLORS[profile.element] || 'text-gray-600 bg-gray-50';
  const icon = WUXING_ICONS[profile.element] || '⭐';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className={`${colorClass} p-6 rounded-t-lg`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-5xl mb-2">{icon}</div>
              <h2 className="text-2xl font-bold">你的五行属性：{profile.element}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 五行平衡度 */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">五行平衡度</h3>
            <div className="space-y-2">
              {Object.entries(profile.wuxing_balance.wuxing_count).map(([element, count]) => (
                <div key={element} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-gray-600">{element}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className={`h-full rounded-full ${WUXING_COLORS[element]?.replace('text-', 'bg-').replace('-600', '-400')}`}
                      style={{ width: `${(count / 8) * 100}%` }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              平衡分数：{profile.wuxing_balance.balance_score} / 100
            </div>
          </div>

          {/* 性格优势 */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">性格优势</h3>
            <div className="flex flex-wrap gap-2">
              {profile.positive_traits.map(trait => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* 需要注意 */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">需要注意</h3>
            <div className="flex flex-wrap gap-2">
              {profile.negative_traits.map(trait => (
                <span
                  key={trait}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* 情绪倾向 */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">情绪倾向</h3>
            <p className="text-gray-700">{profile.emotion_tendency}</p>
          </div>

          {/* 建议 */}
          <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50">
            <h3 className="font-semibold text-gray-800 mb-3">💡 给你的建议</h3>
            <p className="text-gray-700">{profile.advice}</p>
          </div>

          {/* 关闭按钮 */}
          <div className="flex justify-center pt-4">
            <button onClick={onClose} className="btn-primary px-8 py-2">
              知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
