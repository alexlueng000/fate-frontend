'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NavLink from './NavLink';

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
      className={`group relative hidden sm:flex flex-col border-r border-[var(--color-border)] bg-white flex-shrink-0 transition-[width] duration-200 ${
        collapsed ? 'w-14' : 'w-20 lg:w-44'
      }`}
    >
      <nav className="flex flex-col gap-1 p-3 pt-4 flex-1">
        <NavLink href="/report" icon="📄" vertical collapsed={collapsed}>
          命理报告
        </NavLink>
        <NavLink href="/panel" icon="💬" vertical collapsed={collapsed}>
          八字对话
        </NavLink>
        <NavLink href="/xinji" icon="📖" vertical collapsed={collapsed}>
          心镜灯
        </NavLink>
        <NavLink href="/liuyao" icon="🎲" vertical collapsed={collapsed}>
          六爻玄机
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
        title={collapsed ? '展开' : '收起'}
        className="absolute top-6 -right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] shadow-sm opacity-0 group-hover:opacity-100 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-150"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
