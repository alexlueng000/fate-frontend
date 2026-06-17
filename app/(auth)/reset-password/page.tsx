'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { postJSON, api } from '@/app/lib/api';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, Check } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams?.get('email') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 验证
  function validateEmail(v: string): boolean {
    const re = /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
    return re.test(v);
  }

  const emailOk = useMemo(() => validateEmail(email), [email]);
  const codeOk = useMemo(() => /^\d{6}$/.test(code), [code]);
  const pwOk = useMemo(() => password.length >= 8, [password]);
  const confirmOk = useMemo(
    () => confirmPassword === password && confirmPassword.length > 0,
    [password, confirmPassword]
  );

  const canSubmit = useMemo(
    () => emailOk && codeOk && pwOk && confirmOk && !submitting,
    [emailOk, codeOk, pwOk, confirmOk, submitting]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!codeOk) {
      setErr('请输入6位数字验证码');
      return;
    }
    if (!pwOk) {
      setErr('密码至少8位');
      return;
    }
    if (!confirmOk) {
      setErr('两次输入的密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      await postJSON<{ success: boolean; message: string }>(
        api('/auth/password-reset/reset'),
        { email, code, new_password: password }
      );
      setSuccess(true);
      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (e: unknown) {
      setErr((e as Error)?.message || '重置失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-16">
        <div className="relative w-full max-w-[26rem] card px-6 py-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--color-wuxing-wood)_28%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-wuxing-wood)_8%,var(--color-bg-elevated))]">
            <Check className="h-6 w-6 text-[var(--color-wuxing-wood)]" />
          </div>
          <h1
            className="mb-2 text-xl font-medium text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            密码重置成功
          </h1>
          <p className="mb-5 text-sm leading-6 text-[var(--color-text-muted)]">
            正在跳转到登录页面...
          </p>
          <Link
            href="/login"
            className="btn btn-secondary w-full"
          >
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-16 sm:py-20">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[28rem] items-center">
        <div className="relative w-full card px-6 py-7 animate-scale-in sm:px-7 sm:py-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <p className="mb-2 text-[0.8125rem] font-medium tracking-[0.04em] text-[var(--color-text-muted)]">
              账户安全
            </p>
            <h1
              className="mb-2 text-xl font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              重置密码
            </h1>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              输入邮箱验证码，并设置至少 8 位的新密码
            </p>
          </div>

        {/* Error Alert */}
          {err && (
            <div className="mb-4 border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm leading-6 text-[var(--color-primary)]">
              {err}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (readonly if from query) */}
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
              邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
              <input
                className="input !pl-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                readOnly={!!emailFromQuery}
              />
            </div>
          </div>

          {/* Verification Code */}
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
              验证码
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
              <input
                className="input !pl-12 text-center font-mono tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            {code.length > 0 && !codeOk && (
              <p className="mt-1 text-xs text-[var(--color-primary)]">请输入6位数字验证码</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
              新密码
            </label>
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
                aria-label={showPw ? '隐藏密码' : '显示密码'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-hint)] hover:text-[var(--color-text-secondary)] transition-colors"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password.length > 0 && !pwOk && (
              <p className="mt-1 text-xs text-[var(--color-primary)]">密码至少8位</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
              确认密码
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
              <input
                className="input !pl-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder="再次输入新密码"
                autoComplete="new-password"
              />
            </div>
            {confirmPassword.length > 0 && !confirmOk && (
              <p className="mt-1 text-xs text-[var(--color-primary)]">两次输入的密码不一致</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full btn btn-primary py-3 text-base font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                重置中…
              </>
            ) : (
              '重置密码'
            )}
          </button>

          {/* Back to forgot password */}
          <Link
            href="/forgot-password"
            className="flex min-h-11 items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="w-4 h-4" />
            重新获取验证码
          </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold)]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
