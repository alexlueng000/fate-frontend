'use client';

import NavLink from './NavLink';

export default function SideNav() {
  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-44 border-r border-[var(--color-border)] bg-white flex-shrink-0">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        <NavLink href="/panel" icon="💬" vertical>
          八字对话
        </NavLink>
        <NavLink href="/xinji" icon="📖" vertical>
          心镜灯
        </NavLink>
        <NavLink href="/liuyao" icon="🎲" vertical>
          六爻玄机
        </NavLink>
      </nav>
    </aside>
  );
}
