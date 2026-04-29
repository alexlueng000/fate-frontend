'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, logout } from '@/app/lib/auth';
import { ChevronDown, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { user: me } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname || '/')}`);
  }
  function goRegister() {
    router.push('/register');
  }
  async function doLogout() {
    await logout();
    setMenuOpen(false);
    router.push('/');
  }

  const navLinkClass =
    'relative text-sm md:text-base font-medium whitespace-nowrap text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ' +
    'after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[var(--color-primary)] after:rounded-full ' +
    'after:transition-[width] after:duration-300 hover:after:w-full';

  const outlineBtnClass =
    'flex items-center gap-2 h-9 md:h-10 px-4 md:px-5 text-sm md:text-base font-medium rounded-[var(--radius-md)] ' +
    'border border-[var(--color-primary)] text-[var(--color-primary)] ' +
    'hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md transition-all duration-200';

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-8 lg:gap-12 xl:gap-16">
          <Link href="/" className="group shrink-0 flex items-center">
            <Image
              src="/yifan_logo.png"
              alt="易凡文化"
              width={140}
              height={140}
              className="w-32 md:w-36 lg:w-40 h-auto group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-10">
            <Link href="/knowledge" className={navLinkClass}>命理学堂</Link>
            <Link href="/about" className={navLinkClass}>关于我们</Link>
            <Link href="/faq" className={navLinkClass}>常见问题</Link>
            <Link href="/pricing" className={navLinkClass}>套餐定价</Link>
          </nav>
        </div>

        {/* Right Actions */}
        {!me ? (
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={goLogin}
              className="h-9 md:h-10 px-4 md:px-5 text-sm md:text-base font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              登录
            </button>
            <button onClick={goRegister} className={outlineBtnClass}>
              注册
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            {/* 个人中心 */}
            <Link href="/panel" className={outlineBtnClass}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">个人中心</span>
            </Link>

            {/* 管理后台 */}
            {me.is_admin && (
              <Link href="/admin" className={outlineBtnClass}>
                <Settings className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">管理后台</span>
              </Link>
            )}

            {/* User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-9 md:h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 md:px-3 hover:border-[var(--color-border-accent)] hover:shadow-sm transition-all"
              >
                <span className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-xs md:text-sm font-semibold">
                  {(me.nickname || me.username || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[var(--color-text-primary)] text-sm md:text-base font-medium hidden sm:inline max-w-[80px] md:max-w-[100px] truncate">
                  {me.nickname || me.username}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="用户菜单"
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-[var(--radius-lg)] card animate-scale-in shadow-lg"
                >
                  <Link
                    href="/account"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    我的账户
                  </Link>
                  <div className="h-px bg-[var(--color-border)]" />
                  <button
                    role="menuitem"
                    onClick={doLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Accent Line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold-dark)] to-transparent transition-opacity duration-300 ${
          scrolled ? 'opacity-50' : 'opacity-0'
        }`}
      />
    </header>
  );
}
