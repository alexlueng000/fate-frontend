'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, fetchMe, logout } from '@/app/lib/auth';
import Link from 'next/link';
import Image from 'next/image';

import Logo from '@/app/public/fate-logo.png';

export default function Header() {
  const router = useRouter();
  const { user: me, setUser } = useUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!me) {
      void fetchMe().then((u) => {
        if (u) setUser(u);
      });
    }
  }, [me, setUser]);

  function goLogin() {
    const to = `/login?redirect=${encodeURIComponent(window.location.pathname || '/')}`;
    router.push(to);
  }

  function goRegister() {
    router.push('/register');
  }

  async function doLogout() {
    await logout();
    setOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e5c07b] bg-[#fff7e8]/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-3 group">
        <Image
          src={Logo}
          alt="一盏大师 Logo"
          width={160}
          height={160}
          className="w-auto h-20"
          priority
        />
        <span className="text-[#a83232] text-xl font-bold group-hover:opacity-80">
          一盏大师
        </span>
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
        <div className="flex items-center gap-3">
          {/* 新增个人中心按钮 */}
          <Link
            href="/panel"
            className="rounded-xl bg-[#a83232] px-4 py-2 text-[#fdf6e3] hover:bg-[#8c2b2b]"
          >
            个人中心
          </Link>

          {/* 原来的用户菜单 */}
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
        </div>
      )}
      </div>
    </header>
  );
}
