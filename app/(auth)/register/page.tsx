'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON, api } from '@/app/lib/api';
import { saveAuth } from '@/app/lib/auth';

type RegisterReq = {
  username: string;
  password: string;
  nickname?: string;
};

type RegisterResp = {
  id: number;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!username || !password) {
      setErr('请输入用户名和密码');
      return;
    }

    setSubmitting(true);
    try {
      // 调用 /auth/register
      const resp = await postJSON<RegisterResp>(api('/auth/register'), {
        username,
        password,
        nickname,
      } as RegisterReq);

      // 注册完成后，直接跳到登录页
      router.push('/login?redirect=/');
    } catch (e: any) {
      setErr(e?.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf6e3] text-[#4a2c2a]">
      <div className="w-full max-w-sm rounded-2xl border border-[#e5c07b] bg-[#fffdf6] p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 text-[#a83232]">注册</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#7b4b3a] mb-1">用户名</label>
            <input
              className="w-full rounded-xl bg-[#fdf6e3] border border-[#e5c07b] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a83232]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              autoComplete="username"
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
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm text-[#7b4b3a] mb-1">昵称（可选）</label>
            <input
              className="w-full rounded-xl bg-[#fdf6e3] border border-[#e5c07b] px-3 py-2 outline-none focus:ring-2 focus:ring-[#a83232]"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入昵称"
            />
          </div>

          {err && <div className="text-red-600 text-sm">{err}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#a83232] text-[#fdf6e3] py-2 font-medium disabled:opacity-60 hover:bg-[#8c2b2b]"
          >
            {submitting ? '注册中…' : '注册'}
          </button>
        </form>

        <div className="mt-4 text-sm text-[#7b4b3a]">
          已经有账号？
          <a
            className="ml-1 underline underline-offset-4 text-[#a83232] hover:opacity-80"
            href="/login"
          >
            去登录
          </a>
        </div>
      </div>
    </div>
  );
}
