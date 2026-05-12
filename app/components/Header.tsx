'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  FileText,
  BookOpen,
  Dices,
  type LucideIcon,
} from 'lucide-react';

type MobileNavLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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

  const NAV_LINKS: MobileNavLink[] = [
    { href: '/knowledge', label: '命理学堂' },
    { href: '/about', label: '关于我们' },
    { href: '/faq', label: '常见问题' },
    { href: '/pricing', label: '套餐定价' },
  ];

  const MOBILE_APP_LINKS: MobileNavLink[] = [
    { href: '/report', label: '命理报告', icon: FileText },
    { href: '/panel', label: '八字对话', icon: LayoutDashboard },
    { href: '/history', label: '解读记录', icon: History },
    { href: '/xinji', label: '心镜灯', icon: BookOpen },
    { href: '/liuyao', label: '六爻玄机', icon: Dices },
  ];

  const isActivePath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
              {/* Mobile logo */}
              <Image
                src="/yifan_mobile_logo.png"
                alt="易凡文化"
                width={48}
                height={48}
                className="w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-200 lg:hidden"
              />
              {/* Desktop logo */}
              <Image
                src="/yifan_logo.png"
                alt="易凡文化"
                width={140}
                height={140}
                className="hidden lg:block w-32 h-auto group-hover:scale-105 transition-transform duration-200"
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
              className={`lg:hidden flex h-11 w-11 items-center justify-center rounded-[3px] border transition-colors ml-1 ${
                mobileNavOpen
                  ? 'border-[var(--color-primary)] bg-[var(--color-bg-elevated)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
              }`}
              onClick={() => {
                setMenuOpen(false);
                setMobileNavOpen((v) => !v);
              }}
              aria-label="导航菜单"
              aria-expanded={mobileNavOpen}
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
          className="fixed inset-x-0 bottom-0 top-16 z-[45] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div className="absolute inset-0 bg-[rgba(42,37,34,0.28)]" />
          <nav
            aria-label="移动端导航"
            className="absolute left-2 right-2 top-2 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-[4px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[0_16px_44px_rgba(60,40,20,0.16)] animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div>
                <div className="text-[13px] font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
                  常用功能
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  选择一个入口继续
                </div>
              </div>
              <button
                type="button"
                aria-label="关闭导航菜单"
                onClick={() => setMobileNavOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-[3px] border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
              >
                <X className="h-4.5 w-4.5" strokeWidth={1.6} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-px bg-[var(--color-border)] sm:grid-cols-2">
              {MOBILE_APP_LINKS.map((l) => {
                const Icon = l.icon;
                const active = isActivePath(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-14 items-center justify-between gap-3 bg-[var(--color-bg-elevated)] px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] ${
                      active
                        ? 'text-[var(--color-primary)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      {Icon && <Icon className="h-5 w-5 shrink-0 text-[var(--color-text-secondary)]" strokeWidth={1.6} />}
                      <span>{l.label}</span>
                    </span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />}
                  </Link>
                );
              })}
            </div>

            <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
              <div className="mb-2 text-[13px] font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
                了解更多
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {NAV_LINKS.map((l) => {
                  const active = isActivePath(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 items-center rounded-[3px] px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] ${
                        active
                          ? 'bg-[var(--color-bg-hover)] text-[var(--color-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                      }`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
