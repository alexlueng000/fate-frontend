'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMe, useUser } from '@/app/lib/auth';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { profileReturnTarget } from '@/app/lib/onboarding';
import ProfileSetupFlow from '@/app/profile/create/ProfileSetupFlow';

export default function CreateProfilePage() {
  const loading = useRouteGuard(true, false);
  const { user, setUser } = useUser();
  const router = useRouter();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [accountError, setAccountError] = useState(false);

  useEffect(() => {
    setReturnTo(profileReturnTarget(new URLSearchParams(window.location.search).get('next')));
  }, []);

  useEffect(() => {
    if (loading || user) return;
    let active = true;
    void fetchMe().then((current) => {
      if (!active) return;
      if (current) setUser(current);
      else setAccountError(true);
    }).catch(() => { if (active) setAccountError(true); });
    return () => { active = false; };
  }, [loading, user, setUser]);

  useEffect(() => {
    if (!loading && user?.has_profile && returnTo) router.replace(returnTo);
  }, [loading, user?.has_profile, returnTo, router]);

  if (accountError && !user) {
    return <div className="mx-auto max-w-lg px-6 py-20 text-center"><p role="alert">暂时无法读取账号信息，请重新登录后继续。</p><Link href="/login?redirect=%2Fprofile%2Fcreate" className="btn btn-primary mt-6">重新登录</Link></div>;
  }

  if (loading || !user || !returnTo || user.has_profile) {
    return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center"><p role="status" className="text-[var(--color-text-secondary)]">{user?.has_profile ? '正在打开你的解读…' : '正在准备你的空间…'}</p></div>;
  }

  return <ProfileSetupFlow key={user.id} user={user} returnTo={returnTo} />;
}
