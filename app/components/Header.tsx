'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, logout } from '@/app/lib/auth';
import { ChevronDown, LogOut, User, Settings, LayoutDashboard, HelpCircle, Info } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { user: me } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-[var(--color-border)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/yifan_logo.png"
            alt="易凡文化"
            width={160}
            height={160}
            className="group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <Info className="w-4 h-4" />
            关于我们
          </Link>
          <Link
            href="/faq"
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            常见问题
          </Link>
        </nav>

        {/* Right Actions */}
        {!me ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={goLogin} className="btn btn-ghost text-sm px-2 sm:px-4">
              登录
            </button>
            <button onClick={goRegister} className="btn btn-primary text-sm px-3 sm:px-4">
              注册
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Panel Button */}
            <Link href="/panel" className="btn btn-primary text-sm px-2 sm:px-4">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">个人中心</span>
            </Link>

            {/* Admin Button */}
            {me.is_admin && (
              <Link
                href="/admin"
                className="btn text-sm px-2 sm:px-4 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-accent)] hover:text-[var(--color-primary)]"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">管理后台</span>
              </Link>
            )}

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 hover:border-[var(--color-border-accent)] transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] text-white text-sm font-semibold">
                  {(me.nickname || me.username || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="text-[var(--color-text-primary)] text-sm hidden sm:inline">
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
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl card animate-scale-in"
                >
                  <Link
                    href="/account"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    我的账户
                  </Link>
                  <div className="h-px bg-[var(--color-border)]" />
                  <button
                    role="menuitem"
                    onClick={doLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold-dark)] to-transparent opacity-30" />
    </header>
  );
}
