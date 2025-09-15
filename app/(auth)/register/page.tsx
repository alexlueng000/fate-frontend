'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON, api } from '@/app/lib/api';
import { saveAuth, setUserCache } from '@/app/lib/auth';
import { Mail, User as UserIcon, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

// ===== Types kept compatible with your backend contracts =====
export type RegisterReq = {
  email?: string;
  username: string;
  password: string;
  nickname?: string;
};

export type User = {
  id: number;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

export type RegisterResp =
  | { user: User; access_token?: string; token_type?: string }
  | { id: number; username: string; nickname?: string | null; avatar_url?: string | null; email?: string | null };

// ===== Small helpers =====
function validateEmail(v: string): boolean {
  if (!v) return true; // optional
  const re = /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
  return re.test(v);
}

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };
function passwordStrength(pw: string): Strength {
  let score: Strength['score'] = 0;
  if (!pw) return { score: 0, label: '空密码' };
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]|[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['很弱', '较弱', '一般', '较强', '很强'];
  return { score, label: labels[score] };
}

const brand = {
  bg: 'from-[#fffaf1] via-[#fff5e6] to-[#ffe9d6]',
  cardBorder: 'border-[#e5c07b]',
  primary: '#a83232',
  primaryHover: '#8c2b2b',
  textMain: '#4a2c2a',
  textSub: '#7b4b3a',
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [agree, setAgree] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const emailOk = useMemo(() => validateEmail(email), [email]);
  const unameOk = useMemo(() => username.trim().length >= 3, [username]);
  const pwStrength = useMemo(() => passwordStrength(password), [password]);
  const pwOk = useMemo(() => password.length >= 8 && pwStrength.score >= 2, [password, pwStrength]);
  const canSubmit = useMemo(() => agree && unameOk && pwOk && emailOk && !submitting, [agree, unameOk, pwOk, emailOk, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!unameOk) { setErr('用户名至少 3 个字符'); return; }
    if (!pwOk) { setErr('密码至少 8 位，并包含大小写与数字/符号中的至少两类'); return; }
    if (!emailOk) { setErr('邮箱格式不正确'); return; }
    if (!agree) { setErr('请先同意服务条款与隐私政策'); return; }

    setSubmitting(true);
    try {
      // 1) 调用注册
      const resp = await postJSON<RegisterResp>(api('/auth/web/register'), {
        email: email || undefined,
        username: username.trim(),
        password,
        nickname: nickname || undefined,
      } as RegisterReq);

      // 2) 若注册返回里自带 user/token，尝试保存
      if ('user' in resp && resp.user) {
        saveAuth(resp as any);
      }

      // 3) 确保会话：优先 /me（Cookie），否则尝试登录接口
      let me: User | null = null;
      try {
        const r = await fetch(api('/me'), { credentials: 'include' });
        if (r.ok) me = (await r.json()) as User | null;
      } catch {}

      if (!me) {
        try {
          const loginBody: Record<string, string> = { password };
          if (username) loginBody.username = username;
          if (email) loginBody.email = email;
          const loginResp = await postJSON<any>(api('/auth/web/login'), loginBody);
          saveAuth(loginResp);
        } catch {}
        try {
          const r2 = await fetch(api('/me'), { credentials: 'include' });
          if (r2.ok) me = (await r2.json()) as User | null;
        } catch {}
      }

      if (me) setUserCache(me);
      else if ('user' in resp && resp.user) setUserCache(resp.user);
      else {
        const fallbackUser: User = {
          id: (resp as any).id ?? 0,
          username: (resp as any).username ?? username,
          nickname: (resp as any).nickname ?? nickname,
          avatar_url: (resp as any).avatar_url ?? null,
          email: (resp as any).email ?? (email || null),
        };
        setUserCache(fallbackUser);
      }

      setOk('注册成功，正在为你跳转…');
      router.replace('/');
    } catch (e: any) {
      setErr(e?.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${brand.bg} text-[${brand.textMain}] flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md rounded-3xl border ${brand.cardBorder} bg-[#fffdfa]/95 shadow-[0_10px_30px_rgba(168,50,50,0.12)] backdrop-blur`}>        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0e8] border border-[#f2c7a1]">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight" style={{color: brand.primary}}>创建账户</h1>
            <p className="text-sm" style={{color: brand.textSub}}>欢迎加入，一步开启你的专属体验</p>
          </div>
        </div>

        {/* Alert Bars */}
        {err && (
          <div role="alert" className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
        {ok && (
          <div role="status" className="mx-6 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {ok}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm mb-1" style={{color: brand.textSub}}>邮箱（可选）</label>
            <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{['--tw-ring-color' as any]: brand.primary}}>
              <Mail className="h-4 w-4 opacity-80" />
              <input
                className="w-full bg-transparent outline-none placeholder:text-[#b5856f]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                inputMode="email"
                autoComplete="email"
              />
            </div>
            {!emailOk && (
              <div className="mt-1 text-xs text-red-600">邮箱格式不正确</div>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm mb-1" style={{color: brand.textSub}}>用户名</label>
            <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{['--tw-ring-color' as any]: brand.primary}}>
              <UserIcon className="h-4 w-4 opacity-80" />
              <input
                className="w-full bg-transparent outline-none placeholder:text-[#b5856f]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="至少 3 个字符"
                autoComplete="username"
              />
            </div>
            {!unameOk && (
              <div className="mt-1 text-xs text-red-600">用户名至少 3 个字符</div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1" style={{color: brand.textSub}}>密码</label>
            <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{['--tw-ring-color' as any]: brand.primary}}>
              <Lock className="h-4 w-4 opacity-80" />
              <input
                className="w-full bg-transparent outline-none placeholder:text-[#b5856f]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder="至少 8 位，建议包含大小写与数字/符号"
                autoComplete="new-password"
              />
              <button
                type="button"
                aria-label={showPw ? '隐藏密码' : '显示密码'}
                className="p-1 rounded-lg hover:bg-[#ffeede]"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Strength meter */}
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-[#f5e6d6] overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(pwStrength.score / 4) * 100}%`,
                    backgroundColor: pwStrength.score >= 3 ? '#22c55e' : pwStrength.score === 2 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="mt-1 text-xs" style={{color: brand.textSub}}>密码强度：{pwStrength.label}</div>
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm mb-1" style={{color: brand.textSub}}>昵称（可选）</label>
            <input
              className={`w-full rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 outline-none focus:ring-2`}
              style={{['--tw-ring-color' as any]: brand.primary}}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="展示给其他用户的称呼"
            />
          </div>

          {/* Terms */}
          <label className="flex items-center gap-2 text-sm select-none">
            <input type="checkbox" className="accent-[#a83232] h-4 w-4" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span style={{color: brand.textSub}}>
              我已阅读并同意
              <a href="/terms" className="mx-1 underline underline-offset-4 text-[#a83232] hover:opacity-80">服务条款</a>
              与
              <a href="/privacy" className="ml-1 underline underline-offset-4 text-[#a83232] hover:opacity-80">隐私政策</a>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium text-[#fff7ec] shadow-sm transition disabled:opacity-60"
            style={{ backgroundColor: brand.primary }}
            onMouseEnter={(e) => ((e.currentTarget.style.backgroundColor = brand.primaryHover))}
            onMouseLeave={(e) => ((e.currentTarget.style.backgroundColor = brand.primary))}
          >
            {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 注册中…</>) : '注册'}
          </button>

          {/* Footer */}
          <div className="text-sm text-center" style={{color: brand.textSub}}>
            已有账号？
            <a className="ml-1 underline underline-offset-4 text-[#a83232] hover:opacity-80" href="/login">去登录</a>
          </div>
        </form>
      </div>
    </div>
  );
}
