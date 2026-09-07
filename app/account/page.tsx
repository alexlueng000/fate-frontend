'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, fetchMe, getAuthToken, logout } from '@/app/lib/auth';
import Footer from '@/app/components/Footer';
import AccountOverview, { type AccountQuota } from './AccountOverview';
import styles from './account.module.css';

export default function AccountPage() {
  const router = useRouter();
  const { user: me, setUser } = useUser();
  const [quota, setQuota] = useState<AccountQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaError, setQuotaError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    let active = true;
    if (!me) {
      fetchMe().then((user) => {
        if (!active) return;
        if (user) setUser(user);
        else router.replace('/login?redirect=/account');
      });
    }
    return () => { active = false; };
  }, [me, setUser, router]);

  useEffect(() => {
    if (!me?.id) return;
    const controller = new AbortController();
    const token = getAuthToken();
    setQuotaLoading(true);
    setQuotaError('');
    fetch('/api/quota/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('暂时无法获取额度，请重试');
        const data: AccountQuota = await response.json();
        if (!controller.signal.aborted) setQuota(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setQuotaError('暂时无法获取额度，请重试');
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuotaLoading(false);
      });
    return () => controller.abort();
  }, [me?.id, retry]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
      router.replace('/');
    } catch {
      setLogoutError('退出失败，请重试');
      setLoggingOut(false);
    }
  }

  return (
    <div className={styles.page}>
      {me ? (
        <AccountOverview
          user={me} quota={quota} quotaLoading={quotaLoading} quotaError={quotaError}
          loggingOut={loggingOut} logoutError={logoutError}
          onRetry={() => setRetry((value) => value + 1)} onLogout={handleLogout}
        />
      ) : (
        <div className={styles.loading} role="status" aria-label="正在加载账户">
          <div className={styles.loadingTitle} aria-hidden="true" />
          <div className={styles.loadingPanel} aria-hidden="true" />
          <p className={styles.loadingText}>正在加载账户…</p>
        </div>
      )}
      <Footer />
    </div>
  );
}
