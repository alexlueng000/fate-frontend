// app/account/page.tsx
'use client';

import { currentUser } from '@/app/lib/auth';

export default function AccountPage() {
  const me = currentUser();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold text-[#a83232]">我的账户</h1>
      {me ? (
        <div className="rounded-2xl border border-[#e5c07b] bg-[#fffdf6] p-4">
          <div className="text-sm">用户名：{me.username}</div>
          <div className="text-sm">昵称：{me.nickname || '—'}</div>
          <div className="text-sm">邮箱：{me.email || '—'}</div>
        </div>
      ) : (
        <div className="text-sm">未登录</div>
      )}
    </div>
  );
}
