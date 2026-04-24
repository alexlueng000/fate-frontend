'use client';

import NavLink from './NavLink';

export default function TopNav() {
  return (
    <div className="border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex items-center gap-2 py-3">
          <NavLink href="/chat" icon="💬">
            八字对话
          </NavLink>
          <NavLink href="/xinji" icon="📖">
            心镜灯
          </NavLink>
          <NavLink href="/liuyao" icon="🎲">
            六爻玄机
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
