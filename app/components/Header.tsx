'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { currentUser, fetchMe, logout, type User } from '@/app/lib/auth';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  const refreshMe = useCallback(async () => {
    // 1) 先从 sessionStorage 读（注册/登录成功后 saveAuth 会写这里）
    const u = currentUser();
    if (u) {
      setMe(u);
      return;
    }
    // 2) 兼容 Cookie 会话：尝试 /me
    const serverUser = await fetchMe();
    if (serverUser) setMe(serverUser);
  }, []);

  useEffect(() => {
    // 初次挂载：拉取用户
    void refreshMe();

    // 页面回到前台/可见时，再同步一次（从注册/登录页跳回后能立刻更新）
    const onFocus = () => void refreshMe();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshMe();
    };
    // 跨标签页登录/退出时同步（storage 事件只在“其他标签页”触发）
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'me' || e.key === 'auth_token') void refreshMe();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshMe]);

  function goLogin() {
    const to = `/login?redirect=${encodeURIComponent(window.location.pathname || '/')}`;
    router.push(to);
  }

  function goRegister() {
    router.push('/register');
  }

  async function doLogout() {
    await logout();
    setMe(null);
    setOpen(false);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e5c07b] bg-[#fff7e8]/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-[#a83232] text-xl font-bold">
          一盏大师（测试中）
        </Link>

        {!me ? (
          <div className="flex gap-3">
            <button
              onClick={goLogin}
              className="rounded-xl bg-[#a83232] px-4 py-2 text-[#fdf6e3] hover:bg-[#8c2b2b]"
            >
              登录
            </button>
            <button
              onClick={goRegister}
              className="rounded-xl border border-[#a83232] px-4 py-2 text-[#a83232] hover:bg-[#fdeecf]"
            >
              注册
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-[#e5c07b] bg-[#fffdf6] px-4 py-2 hover:bg-[#fdeecf]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#a83232] text-[#fdf6e3]">
                {me.nickname?.[0] || me.username?.[0] || 'U'}
              </span>
              <span className="text-[#4a2c2a] text-base">
                {me.nickname || me.username}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70">
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-[#e5c07b] bg-[#fffdf6] shadow-lg"
                onMouseLeave={() => setOpen(false)}
              >
                <Link
                  href="/account"
                  className="block px-4 py-2 text-sm text-[#4a2c2a] hover:bg-[#fdeecf]"
                  onClick={() => setOpen(false)}
                >
                  我的账户
                </Link>
                <button
                  onClick={doLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-[#a83232] hover:bg-[#fdeecf]"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
