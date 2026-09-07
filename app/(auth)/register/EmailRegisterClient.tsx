'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { postJSON, api } from '@/app/lib/api';
import { saveAuth, setUserCache, useUser, checkProfileStatus } from '@/app/lib/auth';
import { resolvePostAuthRedirect } from '@/app/lib/onboarding';
import AuthShell from '@/app/components/auth/AuthShell';
import styles from '@/app/components/auth/auth.module.css';
import { Mail, User as UserIcon, Lock, Eye, EyeOff, Loader2, Ticket, CheckCircle, XCircle } from 'lucide-react';



export type RegisterReq = {
  email: string;
  username: string;
  password: string;
  invitation_code: string;
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

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const redirect = searchParams.get('redirect');
  const redirectTarget = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect === '/' ? '/dashboard' : redirect
    : null;
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  const [agree, setAgree] = useState(true);
  const [showPw, setShowPw] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // 邀请码验证状态
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // 当用户状态更新后，根据是否有档案决定跳转目标
  useEffect(() => {
    if (!registerSuccess || !user) return;
    (async () => {
      const status = await checkProfileStatus();
      router.replace(resolvePostAuthRedirect(status, redirectTarget));
    })();
  }, [registerSuccess, redirectTarget, user, router]);

  const emailOk = useMemo(() => validateEmail(email), [email]);
  const pwStrength = useMemo(() => passwordStrength(password), [password]);
  const pwOk = useMemo(() => password.length >= 8 && pwStrength.score >= 2, [password, pwStrength]);
  const codeOk = useMemo(() => invitationCode.trim().length >= 4, [invitationCode]);

  const canSubmit = useMemo(() => {
    return emailOk && username.trim().length > 0 && pwOk && codeOk && codeValid === true && agree && !submitting;
  }, [emailOk, username, pwOk, codeOk, codeValid, agree, submitting]);

  // 验证邀请码
  async function validateInvitationCode() {
    if (!codeOk) {
      setCodeValid(null);
      setCodeError(null);
      return;
    }

    setCodeValidating(true);
    setCodeError(null);

    try {
      const resp = await postJSON<{ valid: boolean; message: string }>(
        api('/auth/validate-invitation-code'),
        { code: invitationCode.trim() }
      );
      setCodeValid(resp.valid);
      if (!resp.valid) {
        setCodeError(resp.message);
      }
    } catch (e: unknown) {
      setCodeValid(false);
      setCodeError((e as Error)?.message || '验证失败');
    } finally {
      setCodeValidating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!codeOk) { setErr('请输入邀请码'); return; }
    if (codeValid !== true) { setErr('请输入有效的邀请码'); return; }
    if (!emailOk) { setErr('请输入正确的邮箱'); return; }
    if (!username.trim()) { setErr('请输入用户名'); return; }
    if (!pwOk) { setErr('密码至少 8 位，且强度需达到一般以上'); return; }
    if (!agree) { setErr('请先同意服务条款与隐私政策'); return; }

    setSubmitting(true);
    try {
      const body: RegisterReq = {
        email,
        username: username.trim(),
        password,
        invitation_code: invitationCode.trim(),
      };

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
          nickname: (resp as { nickname?: string }).nickname ?? null,
          avatar_url: (resp as { avatar_url?: string }).avatar_url ?? null,
          email: (resp as { email?: string }).email ?? email,
        };
        setUserCache(fallbackUser);
      }

      setOk('注册成功，正在为你跳转…');
      // 标记注册成功，等待 useEffect 检测到用户状态更新后跳转
      setRegisterSuccess(true);
    } catch (e: unknown) {
      setErr((e as Error)?.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="注册邮箱账户" description="使用邮箱和邀请码创建账户">
        {/* Error/Success Alert */}
        {err && (
          <div role="alert" className={`${styles.error} mb-4`}>
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-4 rounded-[3px] border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
            {ok}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Invitation Code - First and prominent */}
          <div>
            <label htmlFor="register-invitationCode" className={styles.label}>
              邀请码 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-hint)]" />
              <input
                className={`${styles.input} !pl-10 !pr-12`}
                id="register-invitationCode" disabled={submitting}
                value={invitationCode}
                onChange={(e) => {
                  setInvitationCode(e.target.value.toUpperCase());
                  setCodeValid(null);
                  setCodeError(null);
                }}
                onBlur={validateInvitationCode}
                placeholder="请输入邀请码"
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {codeValidating && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-hint)]" />}
                {!codeValidating && codeValid === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                {!codeValidating && codeValid === false && <XCircle className="w-4 h-4 text-[var(--color-primary)]" />}
              </div>
            </div>
            {codeError && (
              <p className="mt-1.5 text-xs text-[var(--color-primary)]">{codeError}</p>
            )}
            {codeValid === true && (
              <p className="mt-1.5 text-xs text-green-500">邀请码有效</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="register-email" className={styles.label}>邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-hint)]" />
              <input
                className={`${styles.input} !pl-10 !pr-12`}
                id="register-email" disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
            </div>
            {!emailOk && email.length > 0 && (
              <p className="mt-1.5 text-xs text-[var(--color-primary)]">邮箱格式不正确</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="register-username" className={styles.label}>用户名</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-hint)]" />
              <input
                className={`${styles.input} !pl-10 !pr-12`}
                id="register-username" disabled={submitting}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="register-password" className={styles.label}>
              密码 <span className="text-[var(--color-text-hint)] font-normal">至少需要8位</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-hint)]" />
              <input
                className={`${styles.input} !pl-10 !pr-12`}
                id="register-password" disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder="至少8位"
                autoComplete="new-password"
              />
              <button
                type="button"
                aria-label={showPw ? '隐藏密码' : '显示密码'} className={styles.eye}
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-2">
              <div className="h-1 w-full rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(pwStrength.score / 4) * 100}%`,
                    backgroundColor: pwStrength.score >= 3 ? '#22c55e' : pwStrength.score === 2 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-body)]">密码强度：{pwStrength.label}</div>
            </div>
          </div>

          {/* Agreement */}
          <label className="flex items-start gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-elevated)] accent-[var(--color-primary)] cursor-pointer"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="text-xs text-[var(--color-text-body)] leading-relaxed">
              我已阅读并同意
              <Link href="/terms" className="mx-1 text-[var(--color-text-body)] hover:underline">服务条款</Link>
              与
              <Link href="/privacy" className="ml-1 text-[var(--color-text-body)] hover:underline">隐私政策</Link>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={styles.primary}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                注册中…
              </>
            ) : (
              <>
                注册邮箱账户
              </>
            )}
          </button>

        </form>
        <div className={styles.footer}>
          <Link href={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login'} className={styles.link}>手机登录 / 注册</Link>
          <Link href={redirectTarget ? `/login?method=email&redirect=${encodeURIComponent(redirectTarget)}` : '/login?method=email'} className={styles.link}>已有邮箱账户？登录</Link>
        </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)]" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
