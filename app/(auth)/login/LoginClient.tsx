'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginWeb, saveAuth, useUser, checkProfileStatus } from '@/app/lib/auth';
import { resolvePostAuthRedirect } from '@/app/lib/onboarding';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import PhoneLoginForm from '@/app/components/PhoneLoginForm';
import AuthShell from '@/app/components/auth/AuthShell';
import styles from '@/app/components/auth/auth.module.css';

type LoginTab = 'email' | 'phone';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const redirect = searchParams.get('redirect');
  const redirectTarget = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect === '/' ? '/dashboard' : redirect
    : null;

  const activeTab: LoginTab = searchParams.get('method') === 'email' ? 'email' : 'phone';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // 当用户状态更新后，根据是否有档案决定跳转目标
  useEffect(() => {
    if (!loginSuccess || !user) return;
    (async () => {
      const status = await checkProfileStatus();
      router.replace(resolvePostAuthRedirect(status, redirectTarget));
    })();
  }, [loginSuccess, redirectTarget, user, router]);

  // Validations
  function validateEmail(v: string): boolean {
    const re = /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
    return re.test(v);
  }
  const emailOk = useMemo(() => validateEmail(email), [email]);
  const pwOk = useMemo(() => password.length >= 1, [password]);

  const canSubmit = useMemo(() => {
    return emailOk && pwOk && !submitting && !loginSuccess;
  }, [emailOk, pwOk, submitting, loginSuccess]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    setSubmitting(true);
    try {
      if (!emailOk) throw new Error('请输入合法邮箱');
      if (!pwOk) throw new Error('请输入密码');
      const resp = await loginWeb({ email, password });
      saveAuth(resp);

      // 标记登录成功，等待 useEffect 检测到用户状态更新后跳转
      setLoginSuccess(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title={activeTab === 'phone' ? '登录 / 注册' : '邮箱登录'} description={activeTab === 'phone' ? '使用手机号，继续探索自己' : '使用已有邮箱账户，继续你的探索'}>
        {/* Error Alert */}
        {activeTab === 'email' && err && (
          <div role="alert" className={styles.error}>
            {err}
          </div>
        )}

        {/* Email Login Form */}
        {activeTab === 'email' && (
          <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <div>
            <label htmlFor="email" className={styles.label}>
              邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
              <input
                id="email" className={`${styles.input} !pl-12`} required disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                inputMode="email"
                autoComplete="email"
              />
            </div>
            {!emailOk && email.length > 0 && (
              <p className="mt-1 text-xs text-[var(--color-primary)]">邮箱格式不正确</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className={styles.label}>
                密码
              </label>
              <Link
                href="/forgot-password"
                className={styles.link}
              >
                忘记密码？
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
              <input
                id="password" className={`${styles.input} !pl-12 !pr-12`} required disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder="输入密码"
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={showPw ? '隐藏密码' : '显示密码'}
                className={styles.eye}
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={styles.primary}
          >
            {submitting || loginSuccess ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登录中…
              </>
            ) : (
              <>
                登录
              </>
            )}
          </button>

        </form>
        )}

        {/* Phone Login Form */}
        {activeTab === 'phone' && <PhoneLoginForm />}
      <div className={styles.footer}>
        {activeTab === 'phone' ? (
          <Link className={styles.link} href={redirectTarget ? `/login?method=email&redirect=${encodeURIComponent(redirectTarget)}` : '/login?method=email'}><Mail size={16} aria-hidden="true" />使用邮箱登录</Link>
        ) : <>
          <Link className={styles.link} href={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login'}>手机登录 / 注册</Link>
          <Link className={styles.link} href={redirectTarget ? `/register?method=email&redirect=${encodeURIComponent(redirectTarget)}` : '/register?method=email'}>注册邮箱账户</Link>
        </>}
      </div>
    </AuthShell>
  );
}
