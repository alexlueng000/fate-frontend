'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON, api } from '@/app/lib/api';
import { saveAuth, setUserCache } from '@/app/lib/auth';

type RegisterReq = {
  email?: string;
  username: string;
  password: string;
  nickname?: string;
};

type User = {
  id: number;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

// 兼容不同后端返回：有的注册会直接返回 user，有的只返回基本字段
type RegisterResp =
  | { user: User; access_token?: string; token_type?: string }
  | { id: number; username: string; nickname?: string | null; avatar_url?: string | null; email?: string | null };

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
      // 1) 调用注册
      const resp = await postJSON<RegisterResp>(api('/auth/web/register'), {
        email: email || undefined,
        username,
        password,
        nickname: nickname || undefined,
      } as RegisterReq);

      // 2) 若注册返回里自带 user（或 token），先尝试保存
      if ('user' in resp && resp.user) {
        saveAuth(resp as any); // 内部会保存 token（若有）与 sessionStorage('me')
      }

      // 3) 尝试确保已登录：
      //    - 若后端在注册时已设置 HttpOnly Cookie，这一步会成功获取到 /me
      //    - 若未设置，则主动再走一遍登录（用用户名/邮箱 + 密码）
      let me: User | null = null;

      // 3.1 优先拉取 /me（Cookie 会话场景）
      try {
        const r = await fetch(api('/me'), { credentials: 'include' });
        if (r.ok) {
          me = (await r.json()) as User | null;
        }
      } catch {}

      // 3.2 若还没有登录态，则兜底调用登录接口（JWT 或设 Cookie）
      if (!me) {
        try {
          const loginBody: Record<string, string> = { password };
          // 后端有的用 username 登录，有的用 email；都尝试一下
          if (username) loginBody.username = username;
          if (email) loginBody.email = email;

          const loginResp = await postJSON<any>(api('/auth/web/login'), loginBody);
          // 保存登录结果（支持 JWT / 或仅 user）
          saveAuth(loginResp);
        } catch (e) {
          // 忽略，让下一步 /me 再试一次
        }

        // 再拉一次 /me
        try {
          const r2 = await fetch(api('/me'), { credentials: 'include' });
          if (r2.ok) me = (await r2.json()) as User | null;
        } catch {}
      }

      // 4) 把 user 放入会话（即便没有 token，也至少保证首页能显示昵称/头像）
      if (me) {
        setUserCache(me);
      } else if ('user' in resp && resp.user) {
        setUserCache(resp.user);
      } else {
        // 最保守：用注册返回的基础字段凑一个
        const fallbackUser: User = {
          id: (resp as any).id ?? 0,
          username: (resp as any).username ?? username,
          nickname: (resp as any).nickname ?? nickname,
          avatar_url: (resp as any).avatar_url ?? null,
          email: (resp as any).email ?? (email || null),
        };
        setUserCache(fallbackUser);
      }

      // 5) 成功 → 直接回首页（而不是去登录页）
      router.replace('/');
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
