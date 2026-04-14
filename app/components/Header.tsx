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
    'relative text-sm whitespace-nowrap text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ' +
    'after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-[var(--color-primary)] ' +
    'after:transition-[width] after:duration-200 hover:after:w-full';

  const outlineBtnClass =
    'flex items-center gap-1.5 h-8 px-3 text-sm rounded-[var(--radius-md)] ' +
    'border border-[var(--color-primary)] text-[var(--color-primary)] ' +
    'hover:bg-[var(--color-primary)] hover:text-white transition-colors';

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="group shrink-0 flex items-center">
          <Image
            src="/yifan_logo.png"
            alt="易凡文化"
            width={140}
            height={140}
            className="group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/knowledge" className={navLinkClass}>命理学堂</Link>
          <Link href="/about" className={navLinkClass}>关于我们</Link>
          <Link href="/faq" className={navLinkClass}>常见问题</Link>
          <Link href="/pricing" className={navLinkClass}>套餐定价</Link>
        </nav>

        {/* Right Actions */}
        {!me ? (
          <div className="flex items-center gap-2">
            <button
              onClick={goLogin}
              className="h-8 px-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              登录
            </button>
            <button onClick={goRegister} className={outlineBtnClass}>
              注册
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* 个人中心 */}
            <Link href="/panel" className={outlineBtnClass}>
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">个人中心</span>
            </Link>

            {/* 管理后台 */}
            {me.is_admin && (
              <Link href="/admin" className={outlineBtnClass}>
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">管理后台</span>
              </Link>
            )}

            {/* User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-8 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 hover:border-[var(--color-border-accent)] transition-colors"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-[var(--color-primary)] text-white text-xs font-semibold">
                  {(me.nickname || me.username || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[var(--color-text-primary)] text-sm hidden sm:inline max-w-[80px] truncate">
                  {me.nickname || me.username}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="用户菜单"
                  className="absolute right-0 mt-2 w-44 overflow-hidden rounded-[var(--radius-lg)] card animate-scale-in"
                >
                  <Link
                    href="/account"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    我的账户
                  </Link>
                  <div className="h-px bg-[var(--color-border)]" />
                  <button
                    role="menuitem"
                    onClick={doLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
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
