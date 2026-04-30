'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, logout } from '@/app/lib/auth';
import {
  ChevronDown,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  FileEdit,
  History,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { user: me } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setMobileNavOpen(false); }
    };
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
    setMobileNavOpen(false);
    router.push('/');
  }

  const navLinkClass =
    'relative text-sm font-medium whitespace-nowrap text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ' +
    'after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[var(--color-primary)] after:rounded-full ' +
    'after:transition-[width] after:duration-300 hover:after:w-full';

  const outlineBtnClass =
    'flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-[var(--radius-md)] ' +
    'border border-[var(--color-primary)] text-[var(--color-primary)] ' +
    'hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md transition-all duration-200';

  const NAV_LINKS = [
    { href: '/knowledge', label: '命理学堂' },
    { href: '/about', label: '关于我们' },
    { href: '/faq', label: '常见问题' },
    { href: '/pricing', label: '套餐定价' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'glass border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-10">

          {/* ── Left: Logo + Desktop Nav ── */}
          <div className="flex items-center gap-6 lg:gap-10">
            <Link href="/" className="group shrink-0 flex items-center">
              <Image
                src="/yifan_logo.png"
                alt="易凡文化"
                width={140}
                height={140}
                className="w-28 lg:w-32 h-auto group-hover:scale-105 transition-transform duration-200"
              />
            </Link>

            {/* Desktop nav — only show on lg+ */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={navLinkClass}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2">
            {!me ? (
              <>
                <button
                  onClick={goLogin}
                  className="h-9 px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  登录
                </button>
                <button onClick={goRegister} className={outlineBtnClass}>
                  注册
                </button>
              </>
            ) : (
              <>
                {/* 个人中心 — icon only on md, text on lg+ */}
                <Link href="/panel" className={outlineBtnClass} title="个人中心">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline">个人中心</span>
                </Link>

                {/* 管理后台 — icon only on md, text on lg+ */}
                {me.is_admin && (
                  <Link href="/admin" className={outlineBtnClass} title="管理后台">
                    <Settings className="w-4 h-4 shrink-0" />
                    <span className="hidden lg:inline">管理后台</span>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 hover:border-[var(--color-border-accent)] hover:shadow-sm transition-all"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-xs font-semibold shrink-0">
                      {(me.nickname || me.username || 'U').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-[var(--color-text-primary)] text-sm font-medium hidden sm:inline max-w-[80px] truncate">
                      {me.nickname || me.username}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform shrink-0 ${menuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      aria-label="用户菜单"
                      className="absolute right-0 mt-2 w-48 overflow-hidden rounded-[var(--radius-lg)] card animate-scale-in shadow-lg"
                    >
                      <Link
                        href="/profile/edit"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <FileEdit className="w-4 h-4 shrink-0" />
                        编辑个人档案
                      </Link>
                      <Link
                        href="/history"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <History className="w-4 h-4 shrink-0" />
                        我的解读记录
                      </Link>
                      <Link
                        href="/feedback"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        意见反馈
                      </Link>
                      <div className="h-px bg-[var(--color-border)]" />
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
              </>
            )}

            {/* 汉堡菜单 — only visible below lg */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors ml-1"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="导航菜单"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Bottom Accent Line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold-dark)] to-transparent transition-opacity duration-300 ${
            scrolled ? 'opacity-50' : 'opacity-0'
          }`}
        />
      </header>

      {/* ── Mobile Nav Drawer ── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <nav
            className="absolute top-16 left-0 right-0 glass border-b border-[var(--color-border)] shadow-lg animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center px-6 py-4 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] border-b border-[var(--color-border-subtle)] transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
