'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NavLink from './NavLink';
import { PRIMARY_NAV, SECONDARY_NAV } from './items';

const STORAGE_KEY = 'sidenav_collapsed';

export default function SideNav() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') setCollapsed(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  };

  return (
    <aside
      className={`group relative hidden sm:flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex-shrink-0 transition-[width] duration-200 motion-reduce:transition-none ${
        collapsed ? 'w-14' : 'w-20 lg:w-44'
      }`}
    >
      <nav aria-label="主导航" className="flex flex-col gap-1 p-3 pt-4 flex-1">
        {PRIMARY_NAV.map(({ href, Icon, longLabel }) => (
          <NavLink
            key={href}
            href={href}
            icon={<Icon size={20} strokeWidth={1.5} />}
            vertical
            collapsed={collapsed}
          >
            {longLabel}
          </NavLink>
        ))}
      </nav>

      <nav aria-label="辅助导航" className="flex flex-col gap-1 border-t border-[var(--color-border)] p-3">
        {SECONDARY_NAV.map(({ href, Icon, longLabel }) => (
          <NavLink
            key={href}
            href={href}
            icon={<Icon size={20} strokeWidth={1.5} />}
            vertical
            collapsed={collapsed}
          >
            {longLabel}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        title={collapsed ? '展开' : '收起'}
        className="absolute top-6 -right-3 z-10 flex items-center justify-center w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] opacity-60 hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--color-primary)] hover:text-[var(--color-text-inverse)] hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)] transition-colors duration-200 motion-reduce:transition-none"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
