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
      className={`hidden sm:flex flex-col border-r border-[var(--color-border)] bg-white flex-shrink-0 transition-[width] duration-200 ${
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
        className="flex items-center justify-center h-9 mx-2 mb-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)] transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
