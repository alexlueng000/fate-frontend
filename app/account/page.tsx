'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, fetchMe, logout } from '@/app/lib/auth';
import { User, Mail, LogOut, Settings, History, ChevronRight, MessageSquare } from 'lucide-react';
import Footer from '@/app/components/Footer';

export default function AccountPage() {
  const router = useRouter();
  const { user: me, setUser } = useUser();

  useEffect(() => {
    if (!me) {
      fetchMe().then((u) => {
        if (u) setUser(u);
        else router.replace('/login?redirect=/account');
      });
    }
  }, [me, setUser, router]);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (!me) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col pt-20">
      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-[var(--color-text-primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              我的账户
            </h1>
            <p className="text-[var(--color-text-muted)]">管理你的个人信息和设置</p>
          </div>

          {/* Profile Card */}
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center text-white text-2xl font-bold">
                {me.nickname?.[0] || me.username?.[0] || '?'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {me.nickname || me.username}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">@{me.username}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)]">
                <User className="w-5 h-5 text-[var(--color-text-muted)]" />
                <div className="flex-1">
                  <div className="text-xs text-[var(--color-text-hint)]">用户名</div>
                  <div className="text-[var(--color-text-primary)]">{me.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)]">
                <Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
                <div className="flex-1">
                  <div className="text-xs text-[var(--color-text-hint)]">邮箱</div>
                  <div className="text-[var(--color-text-primary)]">{me.email || '未设置'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-2">
            <Link
              href="/panel"
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <History className="w-5 h-5 text-[var(--color-gold)]" />
              <span className="flex-1 text-[var(--color-text-primary)]">我的解读记录</span>
              <ChevronRight className="w-5 h-5 text-[var(--color-text-hint)]" />
            </Link>

            <Link
              href="/feedback"
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-[var(--color-gold)]" />
              <span className="flex-1 text-[var(--color-text-primary)]">意见反馈</span>
              <ChevronRight className="w-5 h-5 text-[var(--color-text-hint)]" />
            </Link>

            {me.is_admin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <Settings className="w-5 h-5 text-[var(--color-gold)]" />
                <span className="flex-1 text-[var(--color-text-primary)]">管理后台</span>
                <ChevronRight className="w-5 h-5 text-[var(--color-text-hint)]" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="flex-1 text-[var(--color-primary)]">退出登录</span>
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold)] transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
