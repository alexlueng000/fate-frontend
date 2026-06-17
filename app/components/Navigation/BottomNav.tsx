'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOTTOM_NAV } from './items';

function matchActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function BottomNav() {
  const pathname = usePathname() || '';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)] pb-[env(safe-area-inset-bottom)]">
      <nav aria-label="底部导航" className="flex items-stretch justify-around">
        {BOTTOM_NAV.map(({ href, Icon, shortLabel }) => {
          const active = matchActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`
                flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-2
                transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none
                focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--color-primary-glow)]
                ${active
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)]'
                }
              `}
            >
              <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-xs font-medium leading-none">{shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
