'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postJSON, api } from '@/app/lib/api';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';

const BAGUA = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // 邮箱验证
  function validateEmail(v: string): boolean {
    const re = /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
    return re.test(v);
  }
  const emailOk = useMemo(() => validateEmail(email), [email]);
  const canSubmit = useMemo(
    () => emailOk && !submitting && countdown === 0,
    [emailOk, submitting, countdown]
  );

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!emailOk) {
      setErr('请输入正确的邮箱地址');
      return;
    }

    setSubmitting(true);
    try {
      await postJSON<{ success: boolean; message: string }>(
        api('/auth/password-reset/send-code'),
        { email }
      );
      setCountdown(60);
      // 跳转到重置密码页面
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || '发送失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)] rounded-full opacity-10 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-gold)] rounded-full opacity-10 blur-[80px] animate-pulse-glow delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.02] animate-rotate-slow">
          {BAGUA.map((symbol, i) => (
            <span
              key={i}
              className="absolute text-5xl text-[var(--color-gold)]"
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

      {/* Card */}
      <div className="relative w-full max-w-md card p-6 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-4">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center shadow-lg">
              <span
                className="text-white text-lg font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                盏
              </span>
            </div>
          </Link>
          <h1
            className="text-xl font-bold text-[var(--color-text-primary)] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            找回密码
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            输入您的注册邮箱，我们将发送验证码
          </p>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="mb-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm text-[var(--color-primary)]">
            {err}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
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
                inputMode="email"
                autoComplete="email"
              />
            </div>
            {!emailOk && email.length > 0 && (
              <p className="mt-1 text-xs text-[var(--color-primary)]">邮箱格式不正确</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                发送中…
              </>
            ) : countdown > 0 ? (
              `${countdown}秒后可重新发送`
            ) : (
              <>
                <Send className="w-5 h-5" />
                发送验证码
              </>
            )}
          </button>

          {/* Back to login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回登录
          </Link>
        </form>
      </div>
    </div>
  );
}
