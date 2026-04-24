'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavLinkProps {
  href: string;
  icon: string;
  label: string;
}

function BottomNavLink({ href, icon, label }: BottomNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors
        ${isActive
          ? 'text-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
        }
      `}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-white shadow-[var(--shadow-lg)]">
      <nav className="flex items-center justify-around max-w-md mx-auto">
        <BottomNavLink href="/panel" icon="💬" label="八字" />
        <BottomNavLink href="/xinji" icon="📖" label="心迹" />
        <BottomNavLink href="/liuyao" icon="🎲" label="六爻" />
      </nav>
    </div>
  );
}
