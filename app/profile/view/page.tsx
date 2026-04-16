'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';

interface UserProfile {
  id: number;
  user_id: number;
  gender: string;
  calendar_type: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  bazi_year: string;
  bazi_month: string;
  bazi_day: string;
  bazi_hour: string;
  created_at: string;
  updated_at: string;
}

export default function ViewProfilePage() {
  const router = useRouter();
  const loading = useRouteGuard(true, true); // 需要登录和档案

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const fetchProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('未登录');
          return;
        }

        const response = await fetch(api('/profile/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('获取档案失败');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取档案失败');
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [loading]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <div className="text-neutral-600">加载中...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || '档案不存在'}</div>
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-2 rounded-xl bg-[#a83232] text-white hover:bg-[#8c2b2b] transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EE] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">我的命盘</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/profile/edit')}
              className="px-5 py-2.5 rounded-xl border-2 border-[#a83232] text-[#a83232] hover:bg-[#a83232]/5 transition-colors font-medium"
            >
              修改资料
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="px-5 py-2.5 rounded-xl bg-[#a83232] text-white hover:bg-[#8c2b2b] transition-colors font-medium"
            >
              开始咨询
            </button>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">基本信息</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoItem label="性别" value={profile.gender} />
            <InfoItem label="历法类型" value={profile.calendar_type} />
            <InfoItem label="出生日期" value={profile.birth_date} />
            <InfoItem label="出生时间" value={profile.birth_time} />
            <InfoItem label="出生地点" value={profile.birth_location} className="sm:col-span-2" />
          </div>
        </div>

        {/* 八字命盘 */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">八字命盘</h2>
          <div className="grid grid-cols-4 gap-4">
            <BaziPillar label="年柱" value={profile.bazi_year} />
            <BaziPillar label="月柱" value={profile.bazi_month} />
            <BaziPillar label="日柱" value={profile.bazi_day} />
            <BaziPillar label="时柱" value={profile.bazi_hour} />
          </div>
          <div className="mt-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <p className="text-sm text-neutral-600 leading-relaxed">
              八字命盘是根据您的出生时间计算得出，代表了您的先天命理格局。
              您可以在聊天中询问关于命盘的详细解读。
            </p>
          </div>
        </div>

        {/* 更新时间 */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          最后更新：{new Date(profile.updated_at).toLocaleString('zh-CN')}
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm text-neutral-500 mb-1">{label}</div>
      <div className="text-base font-medium text-neutral-900">{value}</div>
    </div>
  );
}

function BaziPillar({ label, value }: { label: string; value: string }) {
  const [heavenly, earthly] = value.split('');

  return (
    <div className="text-center">
      <div className="text-sm text-neutral-500 mb-3">{label}</div>
      <div className="bg-gradient-to-b from-[#a83232]/10 to-[#a83232]/5 rounded-2xl border-2 border-[#a83232]/20 p-4">
        <div className="text-2xl font-bold text-[#a83232] mb-1">{heavenly}</div>
        <div className="text-2xl font-bold text-[#a83232]">{earthly}</div>
      </div>
    </div>
  );
}
