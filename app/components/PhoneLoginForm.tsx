'use client';

import { useState, useEffect } from 'react';
import { validateChinaPhone, sanitizePhone } from '@/app/lib/phone';
import { loginPhone, saveAuth, checkProfileStatus } from '@/app/lib/auth';
import { resolvePostAuthRedirect } from '@/app/lib/onboarding';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';

type TencentCaptchaResponse = {
  ret: number;
  ticket?: string;
  randstr?: string;
};

type TencentCaptchaConstructor = new (
  appId: string,
  callback: (res: TencentCaptchaResponse) => void,
) => { show: () => void };

// Declare Tencent Captcha global type
declare global {
  interface Window {
    TencentCaptcha?: TencentCaptchaConstructor;
  }
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaLoaded, setCaptchaLoaded] = useState(false);

  // Load Tencent Captcha SDK
  useEffect(() => {
    // Check if script already loaded
    if (window.TencentCaptcha) {
      setCaptchaLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://ssl.captcha.qq.com/TCaptcha.js';
    script.async = true;
    script.onload = () => setCaptchaLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Tencent Captcha SDK');
      setCaptchaLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizePhone(e.target.value);
    if (value.length <= 11) {
      setPhone(value);
      setError('');
    }
  };

  // Handle code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizePhone(e.target.value);
    if (value.length <= 6) {
      setCode(value);
      setError('');
    }
  };

  // Send verification code with captcha
  const handleSendCode = async () => {
    if (!validateChinaPhone(phone)) {
      setError('请输入有效的11位手机号');
      return;
    }

    // Show captcha if SDK loaded
    if (captchaLoaded && window.TencentCaptcha) {
      // Get captcha app ID from environment or use a placeholder
      const captchaAppId = process.env.NEXT_PUBLIC_CAPTCHA_APP_ID || '2000000000';

      const captcha = new window.TencentCaptcha(captchaAppId, async (res) => {
        if (res.ret === 0) {
          // Captcha verified, send SMS code
          await sendSmsCode(res.ticket, res.randstr);
        } else {
          // User closed captcha or verification failed
          console.log('Captcha verification cancelled or failed');
        }
      });

      captcha.show();
    } else {
      // Fallback: send without captcha (dev mode)
      await sendSmsCode();
    }
  };

  // Send SMS code to backend
  const sendSmsCode = async (ticket?: string, randstr?: string) => {
    setLoading(true);
    setError('');

    try {
      const payload: Record<string, string> = { phone, purpose: 'login' };
      if (ticket && randstr) {
        payload.captcha_ticket = ticket;
        payload.captcha_randstr = randstr;
      }

      const resp = await fetch('/api/auth/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        let errorMsg = '发送验证码失败';
        try {
          const json = JSON.parse(text);
          errorMsg = json.detail || json.message || errorMsg;
        } catch {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Start countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateChinaPhone(phone)) {
      setError('请输入有效的11位手机号');
      return;
    }

    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resp = await loginPhone({ phone, code });
      saveAuth(resp);
      const status = await checkProfileStatus();
      router.push(resolvePostAuthRedirect(status, redirectTarget));
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const canSendCode = phone.length === 11 && countdown === 0 && !loading;
  const canLogin = phone.length === 11 && code.length === 6 && !loading;

  return (
    <form onSubmit={handleLogin} className="space-y-3">
      {/* Phone input */}
      <div>
        <label htmlFor="phone" className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
          手机号
        </label>
        <div className="relative">
          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="请输入11位手机号"
            className="input !pl-12"
            disabled={loading}
          />
        </div>
      </div>

      {/* Verification code input with send button */}
      <div>
        <label htmlFor="code" className="block text-xs text-[var(--color-text-secondary)] mb-1.5">
          验证码
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-hint)]" />
            <input
              id="code"
              type="tel"
              inputMode="numeric"
              value={code}
              onChange={handleCodeChange}
              placeholder="请输入6位验证码"
              className="input !pl-12"
              disabled={loading}
            />
          </div>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={!canSendCode}
            className="btn btn-secondary min-w-[118px] px-3 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm text-[var(--color-primary)]">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!canLogin}
        className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            登录中...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            登录
          </>
        )}
      </button>

      {/* Help text */}
      <p className="text-sm text-center text-[var(--color-text-muted)]">
        未注册的手机号将自动创建账号
      </p>
    </form>
  );
}
