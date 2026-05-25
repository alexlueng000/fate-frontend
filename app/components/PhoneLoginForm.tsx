'use client';

import { useState, useEffect } from 'react';
import { validateChinaPhone, sanitizePhone } from '@/app/lib/phone';
import { sendPhoneCode, loginPhone, saveAuth } from '@/app/lib/auth';
import { useRouter } from 'next/navigation';

// Declare Tencent Captcha global type
declare global {
  interface Window {
    TencentCaptcha?: any;
  }
}

export default function PhoneLoginForm() {
  const router = useRouter();
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

      const captcha = new window.TencentCaptcha(captchaAppId, async (res: any) => {
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
      const payload: any = { phone, purpose: 'login' };
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
      router.push('/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const canSendCode = phone.length === 11 && countdown === 0 && !loading;
  const canLogin = phone.length === 11 && code.length === 6 && !loading;

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* Phone input */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
          手机号
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="请输入11位手机号"
          className="input w-full"
          disabled={loading}
        />
      </div>

      {/* Verification code input with send button */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-1.5">
          验证码
        </label>
        <div className="flex gap-2">
          <input
            id="code"
            type="tel"
            inputMode="numeric"
            value={code}
            onChange={handleCodeChange}
            placeholder="请输入6位验证码"
            className="input flex-1"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={!canSendCode}
            className="btn px-4 whitespace-nowrap"
          >
            {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!canLogin}
        className="btn-primary w-full"
      >
        {loading ? '登录中...' : '登录'}
      </button>

      {/* Help text */}
      <p className="text-xs text-[var(--color-text-secondary)] text-center">
        未注册的手机号将自动创建账号
      </p>
    </form>
  );
}
