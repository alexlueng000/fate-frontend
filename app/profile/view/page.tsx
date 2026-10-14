'use client';
import { Button as UiButton } from '@/app/components/ui';


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
  bazi_chart: {
    four_pillars?: {
      year?: string[];
      month?: string[];
      day?: string[];
      hour?: string[];
    };
  } | null;
  created_at: string;
  updated_at: string;
  display_info: string;
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
      <div className="min-h-full bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-neutral-600">加载中...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-full bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || '档案不存在'}</div>
          <UiButton variant="plain"
            onClick={() => router.push('/chat')}
            className="px-6 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[#8c2b2b] transition-colors"
          >
            返回
          </UiButton>
        </div>
      </div>
    );
  }

  return (
    <main className="reading-workspace min-h-full px-4 py-8 sm:p-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-3xl font-medium text-[var(--color-text-primary)]">我的命盘</h1>
          <div className="flex flex-wrap gap-2">
            <UiButton variant="plain"
              onClick={() => router.push('/profile/edit?returnTo=/profile/view')}
              className="px-5 py-2.5 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors font-medium"
            >
              修改资料
            </UiButton>
            <UiButton variant="plain"
              onClick={() => router.push('/chat')}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[#8c2b2b] transition-colors font-medium"
            >
              开始咨询
            </UiButton>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] p-5 sm:p-8 mb-6">
          <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)] mb-6">基本信息</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoItem label="性别" value={profile.gender === 'male' ? '男' : '女'} />
            <InfoItem label="历法类型" value={profile.calendar_type === 'solar' ? '公历' : '农历'} />
            <InfoItem label="出生日期" value={String(profile.birth_date)} />
            <InfoItem label="出生时间" value={String(profile.birth_time)} />
            <InfoItem label="出生地点" value={profile.birth_location} className="sm:col-span-2" />
          </div>
        </div>

        {/* 八字命盘 */}
        {profile.bazi_chart?.four_pillars && (
          <div className="bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border)] p-5 sm:p-8">
            <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)] mb-6">八字命盘</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BaziPillar label="年柱" chars={profile.bazi_chart.four_pillars.year ?? []} />
              <BaziPillar label="月柱" chars={profile.bazi_chart.four_pillars.month ?? []} />
              <BaziPillar label="日柱" chars={profile.bazi_chart.four_pillars.day ?? []} />
              <BaziPillar label="时柱" chars={profile.bazi_chart.four_pillars.hour ?? []} />
            </div>
            <div className="mt-6 p-4 rounded-xl bg-[var(--color-bg-alt)] border border-[var(--color-border)]">
              <p className="text-sm text-neutral-600 leading-relaxed">
                八字命盘是根据您的出生时间计算得出，代表了您的先天命理格局。
                您可以在聊天中询问关于命盘的详细解读。
              </p>
            </div>
          </div>
        )}

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

function BaziPillar({ label, chars }: { label: string; chars: string[] }) {
  const [heavenly, earthly] = chars;

  return (
    <div className="text-center">
      <div className="text-sm text-neutral-500 mb-3">{label}</div>
      <div className="bg-gradient-to-b from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 rounded-2xl border-2 border-[var(--color-primary)]/20 p-4">
        <div className="text-2xl font-bold text-[var(--color-primary)] mb-1">{heavenly ?? '—'}</div>
        <div className="text-2xl font-bold text-[var(--color-primary)]">{earthly ?? '—'}</div>
      </div>
    </div>
  );
}
