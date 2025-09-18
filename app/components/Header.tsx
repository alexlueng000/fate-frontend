'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, fetchMe, logout } from '@/app/lib/auth';
import Logo from '@/app/public/fate-logo.png';

export default function Header() {
  const router = useRouter();
  const { user: me, setUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 拉取用户信息 & 登录成功后跳转
  useEffect(() => {
    if (!me) {
      void fetchMe().then((u) => {
        if (u) {
          setUser(u);
          router.push('/panel'); // 登录成功后跳转
        }
      });
    }
  }, [me, setUser, router]);

  // 滚动态
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 点击外部/ESC 关闭菜单
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function goLogin() {
    const to = `/login?redirect=${encodeURIComponent(window.location.pathname || '/')}`;
    router.push(to);
  }
  function goRegister() {
    router.push('/register');
  }
  async function doLogout() {
    await logout();
    setMenuOpen(false);
    router.push('/');
  }

  // === 样式（国风暖色调）===
  const headerWrap = 'fixed top-0 z-50 w-full backdrop-blur border-b transition-all';
  const headerState = scrolled
    ? 'bg-[#fff7e8]/95 shadow-md border-[#f0d9a6]'
    : 'bg-[#fff7e8]/80 border-transparent';

  const mainBtn =
    'inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-medium min-w-[96px]' +
    ' transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c07b]';

  const primaryBtn =
    mainBtn +
    ' bg-[#a83232] text-[#fff7e8] hover:bg-[#8c2b2b] active:scale-[0.98]';

  const ghostBtn =
    mainBtn +
    ' border border-[#a83232] text-[#a83232] bg-white/70 hover:bg-[#fdeecf] active:scale-[0.98]';

  return (
    <header className={`${headerWrap} ${headerState}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-18">
        {/* 左侧 Logo */}
        <Link href="/" className="group flex items-center gap-2 sm:gap-3">
          <Image
            src={Logo}
            alt="一盏大师 Logo"
            width={240}
            height={240}
            className="h-16 w-auto sm:h-18"
            priority
          />
          <span className="text-xl sm:text-2xl font-bold tracking-wide text-[#a83232] group-hover:opacity-90">
            一盏大师
          </span>
        </Link>

        {/* 右侧操作区 */}
        {!me ? (
          <div className="flex items-center gap-3">
            <button onClick={goLogin} className={primaryBtn}>
              登录
            </button>
            <button onClick={goRegister} className={ghostBtn}>
              注册
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* 个人中心按钮 */}
            <Link
              href="/panel"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#a83232] px-5 text-sm font-medium text-[#fff7e8] hover:bg-[#8c2b2b] transition"
            >
              个人中心
            </Link>

            {/* 如果是管理员，显示管理后台 */}
            {me.is_admin && (
              <Link
                href="/admin"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#4a2c2a] px-5 text-sm font-medium text-white hover:bg-[#2c1b19] transition"
              >
                管理后台
              </Link>
            )}

            {/* 用户菜单 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#e5c07b] bg-[#fffdf6] px-3 hover:bg-[#fdeecf] transition"
              >
                <span className="p-[2px] rounded-full bg-gradient-to-tr from-[#a83232] to-[#e5c07b]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a83232] text-[#fff7e8] text-sm font-semibold">
                    {(me.nickname || me.username || 'U').slice(0, 1).toUpperCase()}
                  </span>
                </span>
                <span className="text-[#4a2c2a] text-sm">{me.nickname || me.username}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className="opacity-70"
                  aria-hidden="true"
                >
                  <path fill="currentColor" d="M7 10l5 5 5-5z" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="用户菜单"
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-[#e5c07b] bg-[#fffdf6] shadow-lg"
                >
                  <Link
                    href="/account"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-[#4a2c2a] hover:bg-[#fdeecf]"
                    onClick={() => setMenuOpen(false)}
                  >
                    我的账户
                  </Link>
                  <button
                    role="menuitem"
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

      {/* 顶部细饰条 */}
      <div className="pointer-events-none h-[2px] w-full bg-gradient-to-r from-[#f7e6bf] via-[#e5c07b] to-[#f7e6bf]" />
    </header>
  );
}
