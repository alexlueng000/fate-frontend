'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  vertical?: boolean;
  collapsed?: boolean;
}

export default function NavLink({ href, icon, children, className = '', vertical = false, collapsed = false }: NavLinkProps) {
  const pathname = usePathname() || '';
  const isActive = pathname === href || pathname.startsWith(href + '/');

  if (vertical) {
    return (
      <Link
        href={href}
        title={collapsed ? String(children) : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`
          flex flex-col items-center gap-1.5 px-2 py-3 rounded-[3px] transition-colors transition-shadow duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none text-center
          focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]
          ${isActive
            ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)]'
          }
          ${className}
        `}
      >
        {icon && <span className="text-2xl leading-none">{icon}</span>}
        {!collapsed && (
          <span className="text-[13px] font-medium tracking-[0.04em] leading-tight">{children}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-[3px] transition-colors transition-shadow duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none
        focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]
        ${isActive
          ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)]'
        }
        ${className}
      `}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="font-medium">{children}</span>
    </Link>
  );
}
