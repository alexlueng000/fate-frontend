'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { validateChinaPhone, sanitizePhone } from '@/app/lib/phone';
import { loginPhone, saveAuth, checkProfileStatus } from '@/app/lib/auth';
import { resolvePostAuthRedirect } from '@/app/lib/onboarding';
import { api } from '@/app/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import styles from '@/app/components/auth/auth.module.css';

type TencentCaptchaResponse = { ret: number; ticket?: string; randstr?: string };
type TencentCaptchaConstructor = new (
  appId: string,
  callback: (res: TencentCaptchaResponse) => void,
) => { show: () => void };

declare global {
  interface Window { TencentCaptcha?: TencentCaptchaConstructor }
}

// Keep the resend deadline when switching between authentication methods.
let resendAvailableAt = 0;

export default function PhoneLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const redirectTarget = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect === '/' ? '/dashboard' : redirect
    : null;
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const sendInFlight = useRef(false);
  const loginInFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const updateCountdown = () => setCountdown(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, []);

  async function sendSmsCode(targetPhone: string, ticket?: string, randstr?: string) {
    try {
      const payload: Record<string, string> = { phone: targetPhone, purpose: 'login' };
      if (ticket && randstr) {
        payload.captcha_ticket = ticket;
        payload.captcha_randstr = randstr;
      }
      const resp = await fetch(api('/auth/sms/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        const message = body?.detail || body?.message;
        throw new Error(typeof message === 'string' ? message : '发送失败，请稍后重试');
      }
      resendAvailableAt = Date.now() + 60_000;
      if (!mounted.current) return;
      setCountdown(60);
      setStatus(`验证码已发送至 ${targetPhone.slice(0, 3)} **** ${targetPhone.slice(-4)}`);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : '发送失败，请稍后重试');
    } finally {
      sendInFlight.current = false;
      if (mounted.current) {
        setSending(false);
        // Focus after the disabled field becomes available again.
        requestAnimationFrame(() => { if (mounted.current) codeRef.current?.focus(); });
      }
    }
  }

  async function handleSendCode() {
    if (sendInFlight.current || loginInFlight.current || Date.now() < resendAvailableAt) return;
    if (!validateChinaPhone(phone)) {
      setPhoneTouched(true);
      return;
    }
    sendInFlight.current = true;
    setSending(true);
    setError('');
    setStatus('');
    try {
      if (window.TencentCaptcha) {
        const captcha = new window.TencentCaptcha(
          process.env.NEXT_PUBLIC_CAPTCHA_APP_ID || '2000000000',
          (res) => {
            if (!mounted.current) return;
            if (res.ret === 0) {
              void sendSmsCode(phone, res.ticket, res.randstr);
            } else {
              sendInFlight.current = false;
              setSending(false);
              setStatus('验证未完成，请重新获取验证码');
            }
          },
        );
        captcha.show();
      } else {
        // Preserve the existing backend-controlled development fallback.
        await sendSmsCode(phone);
      }
    } catch {
      sendInFlight.current = false;
      setSending(false);
      setError('安全验证暂时不可用，请重试');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loginInFlight.current || sendInFlight.current) return;
    if (!validateChinaPhone(phone) || !/^\d{6}$/.test(code)) {
      setError('请输入有效手机号和6位验证码');
      return;
    }
    loginInFlight.current = true;
    setLoggingIn(true);
    setError('');
    try {
      const resp = await loginPhone({ phone, code });
      saveAuth(resp);
      const profile = await checkProfileStatus();
      router.replace(resolvePostAuthRedirect(profile, redirectTarget));
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
      setLoggingIn(false);
      loginInFlight.current = false;
    }
  }

  const phoneInvalid = phoneTouched && phone.length > 0 && !validateChinaPhone(phone);
  const busy = sending || loggingIn;
  return (
    <>
      <Script src="https://turing.captcha.qcloud.com/TJCaptcha.js" strategy="afterInteractive" />
      <form onSubmit={handleLogin} className={styles.form}>
        <div>
          <label htmlFor="phone" className={styles.label}>手机号</label>
          <div className={styles.phoneField}>
            <span className={styles.prefix} aria-hidden="true">+86</span>
            <input
              id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national"
              className={`${styles.input} ${styles.phoneInput}`}
              value={phone} placeholder="请输入11位手机号" required
              aria-invalid={phoneInvalid} aria-describedby={phoneInvalid ? 'phone-error' : undefined}
              onBlur={() => setPhoneTouched(true)}
              onChange={(e) => {
                setPhone(sanitizePhone(e.target.value).slice(0, 11));
                setCode(''); setError(''); setStatus('');
              }}
              disabled={busy}
            />
          </div>
          {phoneInvalid && <p id="phone-error" className={styles.hint}>请输入有效的中国大陆手机号</p>}
        </div>
        <div>
          <label htmlFor="code" className={styles.label}>短信验证码</label>
          <div className={styles.codeRow}>
            <input
              ref={codeRef} id="code" name="code" type="text" inputMode="numeric"
              autoComplete="one-time-code" pattern="[0-9]{6}" required
              className={styles.input} placeholder="6位验证码" value={code}
              onChange={(e) => { setCode(sanitizePhone(e.target.value).slice(0, 6)); setError(''); }}
              disabled={busy}
            />
            <button type="button" onClick={handleSendCode}
              disabled={!validateChinaPhone(phone) || countdown > 0 || busy}
              className={styles.sendButton}>
              {sending ? '发送中…' : countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
            </button>
          </div>
          <div aria-live="polite">
            {status && <p className={styles.hint}>{status}</p>}
          </div>
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div>
          <p className={`${styles.note} mb-4`}>未注册的手机号验证后将自动创建账号</p>
          <button type="submit" disabled={!validateChinaPhone(phone) || code.length !== 6 || busy} className={styles.primary}>
            {loggingIn && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {loggingIn ? '登录中…' : '登录 / 注册'}
          </button>
          <p className={`${styles.hint} !mt-4`}>
            点击登录 / 注册，即表示同意
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="inline-block underline underline-offset-4">《服务条款》</Link>
            和
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="inline-block underline underline-offset-4">《隐私政策》</Link>
          </p>
        </div>
      </form>
    </>
  );
}
