'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { BOTTOM_NAV, MORE_NAV } from './items';

function matchActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_NAV.some(({ href }) => matchActive(pathname, href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40" role="presentation" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-[rgba(42,37,34,0.28)]" />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="更多功能"
            className="absolute inset-x-3 bottom-[calc(68px+env(safe-area-inset-bottom))] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div>
                <p className="text-[15px] font-medium text-[var(--color-text-primary)]">更多功能</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">报告、记录与学习入口</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="关闭更多功能"
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)]"
              >
                <X size={20} />
              </button>
            </header>
            <nav aria-label="更多功能导航" className="grid grid-cols-2 gap-px bg-[var(--color-border)]">
              {MORE_NAV.map(({ href, Icon, longLabel }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-20 items-center gap-3 bg-[var(--color-bg-elevated)] px-4 text-[14px] font-medium text-[var(--color-text-primary)]"
                >
                  <Icon size={21} strokeWidth={1.5} className="text-[var(--color-primary)]" />
                  {longLabel}
                </Link>
              ))}
            </nav>
          </section>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)] pb-[env(safe-area-inset-bottom)]">
        <nav aria-label="底部导航" className="flex items-stretch justify-around">
          {BOTTOM_NAV.map(({ href, Icon, shortLabel }) => {
            const active = matchActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--color-primary-glow)] ${
                  active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <span className="text-xs font-medium leading-none">{shortLabel}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 ${
              moreOpen || moreActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={1.5} aria-hidden="true" />
            <span className="text-xs font-medium leading-none">更多</span>
          </button>
        </nav>
      </div>
    </>
  );
}
