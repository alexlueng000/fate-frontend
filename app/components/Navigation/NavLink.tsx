'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function NavLink({ href, icon, children, className = '' }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

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
