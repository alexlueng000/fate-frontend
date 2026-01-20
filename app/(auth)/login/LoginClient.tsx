'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginWeb, saveAuth } from '@/app/lib/auth';
import { postJSON, api } from '@/app/lib/api';
import { Mail, Lock, Eye, EyeOff, Loader2, Phone, Hash, Sparkles } from 'lucide-react';

// 八卦符号
const BAGUA = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();

  const raw = search.get('redirect');
  // 过滤掉登录/注册页面，避免循环跳转
  const redirect = !raw || raw === '/' || raw === '/login' || raw === '/register' ? '/panel' : raw;

  const [mode, setMode] = useState<'password' | 'sms'>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Validations
  function validateEmail(v: string): boolean {
    const re = /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
    return re.test(v);
  }
  const emailOk = useMemo(() => validateEmail(email), [email]);
  const pwOk = useMemo(() => password.length >= 1, [password]);
  const phoneOk = useMemo(() => {
    const e164 = /^\+?\d{6,15}$/;
    const cn = /^1\d{10}$/;
    return e164.test(phone) || cn.test(phone);
  }, [phone]);
  const codeOk = useMemo(() => code.trim().length >= 4, [code]);

  const canSubmit = useMemo(() => {
    if (mode === 'password') return emailOk && pwOk && !submitting;
    return phoneOk && codeOk && !submitting;
  }, [mode, emailOk, pwOk, phoneOk, codeOk, submitting]);

  // Send SMS code
  async function sendCode() {
    setErr(null);
    if (!phoneOk || sendingCode || cooldown > 0) return;
    setSendingCode(true);
    try {
      await postJSON(api('/auth/web/send_sms'), { phone, scene: 'login' });
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      setErr((e as Error)?.message || '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    setSubmitting(true);
    try {
      if (mode === 'password') {
        if (!emailOk) throw new Error('请输入合法邮箱');
        if (!pwOk) throw new Error('请输入密码');
        const resp = await loginWeb({ email, password });
        saveAuth(resp);
      } else {
        if (!phoneOk) throw new Error('请填写正确的手机号');
        if (!codeOk) throw new Error('请输入验证码');
        const resp = await postJSON<{ access_token: string; user: unknown }>(
          api('/auth/web/login_sms'),
          { phone, sms_code: code }
        );
        saveAuth(resp);
      }

      try {
        window.dispatchEvent(new StorageEvent('storage', { key: 'me' }));
      } catch {}

      router.replace(redirect);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
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

        {/* Rotating Bagua */}
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

      {/* Login Card */}
      <div className="relative w-full max-w-md card p-8 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                盏
              </span>
            </div>
          </Link>
          <h1
            className="text-2xl font-bold text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            欢迎回来
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            登录以继续使用一盏大师
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--color-bg-elevated)] mb-6">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'password'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            邮箱密码
          </button>
          <button
            type="button"
            onClick={() => setMode('sms')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'sms'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            手机验证码
          </button>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="mb-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
            {err}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'password' ? (
            <>
              {/* Email */}
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input pl-12"
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
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input pl-12 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPw ? 'text' : 'password'}
                    placeholder="输入密码"
                    autoComplete="current-password"
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
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot"
                  className="text-sm text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors"
                >
                  忘记密码？
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Phone */}
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                  手机号
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                  <input
                    className="input pl-12"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.trim())}
                    placeholder="支持 +区号 或 11位大陆号码"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                {!phoneOk && phone.length > 0 && (
                  <p className="mt-1 text-xs text-[var(--color-primary)]">手机号格式不正确</p>
                )}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                  验证码
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
                    <input
                      className="input pl-12"
                      value={code}
                      onChange={(e) => setCode(e.target.value.trim())}
                      placeholder="输入验证码"
                      inputMode="numeric"
                      pattern="\d*"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={!phoneOk || sendingCode || cooldown > 0}
                    className="btn btn-secondary shrink-0 px-4"
                  >
                    {cooldown > 0 ? `${cooldown}s` : sendingCode ? '发送中…' : '发送验证码'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登录中…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                登录
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-sm text-center text-[var(--color-text-muted)]">
            还没有账号？
            <Link
              href="/register"
              className="ml-1 text-[var(--color-gold)] hover:text-[var(--color-gold-light)] transition-colors"
            >
              去注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
