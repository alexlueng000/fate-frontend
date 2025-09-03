'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWeb, saveAuth } from '@/app/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();

  // ✅ 默认跳到 /panel（如果没传 redirect 或 redirect === '/'）
  const raw = search.get('redirect');
  const redirect = !raw || raw === '/' ? '/panel' : raw;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email || !password) {
      setErr('请输入邮箱和密码');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await loginWeb({ email, password });
      saveAuth(resp);
      router.replace(redirect); // ✅ 登录完成后去 panel
    } catch (e: any) {
      setErr(e?.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf6e3] text-[#4a2c2a]">
      <div className="w-full max-w-sm rounded-2xl border border-[#e5c07b] bg-[#fffdf6] p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 text-[#a83232]">登录</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#7b4b3a] mb-1">邮箱</label>
            <input
              className="w-full rounded-xl bg-[#fdf6e3] border border-[#e5c07b] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a83232]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入邮箱"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-[#7b4b3a] mb-1">密码</label>
            <input
              className="w-full rounded-xl bg-[#fdf6e3] border border-[#e5c07b] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a83232]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="输入密码"
              autoComplete="current-password"
            />
          </div>

          {err && <div className="text-red-600 text-sm">{err}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#a83232] text-[#fdf6e3] py-2 font-medium disabled:opacity-60 hover:bg-[#8c2b2b]"
          >
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-4 text-sm text-[#7b4b3a]">
          还没有账号？
          <a
            className="ml-1 underline underline-offset-4 text-[#a83232] hover:opacity-80"
            href="/register"
          >
            去注册
          </a>
        </div>
      </div>
    </div>
  );
}
