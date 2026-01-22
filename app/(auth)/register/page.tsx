'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postJSON, api } from '@/app/lib/api';
import { saveAuth, setUserCache } from '@/app/lib/auth';
import { Mail, User as UserIcon, Lock, Eye, EyeOff, Loader2, Phone, Hash, Sparkles } from 'lucide-react';

const BAGUA = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

export type RegisterReq = {
  email: string;
  username?: string;
  password?: string;
  nickname?: string;
  phone?: string;
  code?: string;
};

export type User = {
  id: number;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  email: string;
};

export type RegisterResp =
  | { user: User; access_token?: string; token_type?: string }
  | { id: number; username: string; nickname?: string | null; avatar_url?: string | null; email: string };

function validateEmail(v: string): boolean {
  if (!v) return false;
  const re = /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
  return re.test(v);
}

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (!pw) return { score: 0, label: '空密码' };
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]|[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['很弱', '较弱', '一般', '较强', '很强'];
  return { score, label: labels[Math.min(score, labels.length - 1)] };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  const [mode, setMode] = useState<'account' | 'phone'>('account');
  const [agree, setAgree] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const emailOk = useMemo(() => validateEmail(email), [email]);
  const unameOk = useMemo(() => username.trim().length >= 3, [username]);
  const pwStrength = useMemo(() => passwordStrength(password), [password]);
  const pwOk = useMemo(() => password.length >= 8 && pwStrength.score >= 2, [password, pwStrength]);
  const phoneOk = useMemo(() => /^\d{11}$/.test(phone), [phone]);
  const codeOk = useMemo(() => code.length >= 4, [code]);

  const canSubmit = useMemo(() => {
    if (!emailOk) return false;
    if (mode === 'account') return unameOk && pwOk && agree && !submitting;
    if (mode === 'phone') return phoneOk && codeOk && agree && !submitting;
    return false;
  }, [mode, emailOk, unameOk, pwOk, phoneOk, codeOk, agree, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!emailOk) { setErr('请输入正确的邮箱'); return; }
    if (mode === 'account' && !unameOk) { setErr('用户名至少 3 个字符'); return; }
    if (mode === 'account' && !pwOk) { setErr('密码至少 8 位，且强度需达到一般以上'); return; }
    if (mode === 'phone' && !phoneOk) { setErr('请输入正确的手机号'); return; }
    if (mode === 'phone' && !codeOk) { setErr('请输入验证码'); return; }
    if (!agree) { setErr('请先同意服务条款与隐私政策'); return; }

    setSubmitting(true);
    try {
      const body: RegisterReq = { email };
      if (mode === 'account') {
        body.username = username.trim();
        body.password = password;
        body.nickname = nickname || undefined;
      } else {
        body.phone = phone;
        body.code = code;
      }

      const resp = await postJSON<RegisterResp>(api('/auth/web/register'), body);

      if ('user' in resp && resp.user) {
        saveAuth(resp as { access_token: string; user: User });
      }

      let me: User | null = null;
      try {
        const r = await fetch(api('/me'), { credentials: 'include' });
        if (r.ok) me = (await r.json()) as User | null;
      } catch {}

      if (me) setUserCache(me);
      else if ('user' in resp && resp.user) setUserCache(resp.user);
      else {
        const fallbackUser: User = {
          id: (resp as { id?: number }).id ?? 0,
          username: (resp as { username?: string }).username ?? username,
          nickname: (resp as { nickname?: string }).nickname ?? nickname,
          avatar_url: (resp as { avatar_url?: string }).avatar_url ?? null,
          email: (resp as { email?: string }).email ?? email,
        };
        setUserCache(fallbackUser);
      }

      setOk('注册成功，正在为你跳转…');
      router.replace('/');
    } catch (e: unknown) {
      setErr((e as Error)?.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)] rounded-full opacity-5 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-gold)] rounded-full opacity-5 blur-[80px] animate-pulse-glow delay-500" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] animate-rotate-slow">
          {BAGUA.map((symbol, i) => (
            <span
              key={i}
              className="absolute text-5xl text-[var(--color-primary)]"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 45}deg) translateY(-250px) rotate(-${i * 45}deg)`,
              }}
            >
              {symbol}
            </span>
          ))}
        </div>
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-md card p-6 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-4">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                盏
              </span>
            </div>
          </Link>
          <h1
            className="text-xl font-bold text-[var(--color-text-primary)] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            创建账户
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            注册以解锁完整功能
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--color-bg-elevated)] mb-4">
          <button
            type="button"
            onClick={() => setMode('account')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'account'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            邮箱注册
          </button>
          <button
            type="button"
            onClick={() => setMode('phone')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'phone'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            手机注册
          </button>
        </div>

        {/* Error/Success Alert */}
        {err && (
          <div className="mb-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm text-[var(--color-primary)]">
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-400">
            {ok}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'account' ? (
            <>
              {/* Email */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input !pl-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                  />
                </div>
                {!emailOk && email.length > 0 && (
                  <p className="mt-1 text-xs text-[var(--color-primary)]">邮箱格式不正确</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">用户名</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input !pl-12"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="至少3个字符"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input !pl-12 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPw ? 'text' : 'password'}
                    placeholder="至少8位"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-hint)] hover:text-[var(--color-text-secondary)]"
                    onClick={() => setShowPw((v) => !v)}
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(pwStrength.score / 4) * 100}%`,
                        backgroundColor: pwStrength.score >= 3 ? '#22c55e' : pwStrength.score === 2 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">密码强度：{pwStrength.label}</div>
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">昵称（可选）</label>
                <input
                  className="input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="展示给其他用户的称呼"
                />
              </div>
            </>
          ) : (
            <>
              {/* Email for phone mode */}
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input !pl-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input !pl-12"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11位手机号"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">验证码</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                    <input
                      className="input !pl-12"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="输入验证码"
                      inputMode="numeric"
                    />
                  </div>
                  <button type="button" className="btn btn-secondary shrink-0 px-4">
                    获取验证码
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Agreement */}
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-elevated)] accent-[var(--color-primary)]"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="text-[var(--color-text-muted)]">
              我已阅读并同意
              <Link href="/terms" className="mx-1 text-[var(--color-gold)] hover:underline">服务条款</Link>
              与
              <Link href="/privacy" className="ml-1 text-[var(--color-gold)] hover:underline">隐私政策</Link>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                注册中…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                注册
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-sm text-center text-[var(--color-text-muted)]">
            已有账号？
            <Link href="/login" className="ml-1 text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors">
              去登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
