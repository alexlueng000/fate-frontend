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
}

export default function NavLink({ href, icon, children, className = '', vertical = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  if (vertical) {
    return (
      <Link
        href={href}
        className={`
          flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all text-center
          ${isActive
            ? 'bg-[var(--color-primary)] text-white shadow-md'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)]'
          }
          ${className}
        `}
      >
        {icon && <span className="text-2xl leading-none">{icon}</span>}
        <span className="text-[11px] font-medium leading-tight lg:text-xs">{children}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-all
        ${isActive
          ? 'bg-[var(--color-primary)] text-white shadow-md'
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
