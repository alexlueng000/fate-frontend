'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWeb, saveAuth } from '@/app/lib/auth';
import { postJSON, api } from '@/app/lib/api';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Phone, Hash } from 'lucide-react';

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();

  // ✅ 默认跳到 /panel（如果没传 redirect 或 redirect === '/'）
  const raw = search.get('redirect');
  const redirect = !raw || raw === '/' ? '/panel' : raw;

  const [mode, setMode] = useState<'password' | 'sms'>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 秒

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ===== brand =====
  const brand = {
    bg: 'from-[#fffaf1] via-[#fff5e6] to-[#ffe9d6]',
    cardBorder: 'border-[#e5c07b]',
    primary: '#a83232',
    primaryHover: '#8c2b2b',
    textMain: '#4a2c2a',
    textSub: '#7b4b3a',
  } as const;

  // ===== validations =====
  function validateEmail(v: string): boolean {
    const re = /^(?:[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/;
    return re.test(v);
  }
  const emailOk = useMemo(() => validateEmail(email), [email]);
  const pwOk = useMemo(() => password.length >= 1, [password]);
  const phoneOk = useMemo(() => { const e164 = /^\+?\d{6,15}$/; const cn = /^1\d{10}$/; return e164.test(phone) || cn.test(phone); }, [phone]);
  const codeOk = useMemo(() => code.trim().length >= 4, [code]);

  const canSubmit = useMemo(() => {
    if (mode === 'password') return emailOk && pwOk && !submitting;
    return phoneOk && codeOk && !submitting;
  }, [mode, emailOk, pwOk, phoneOk, codeOk, submitting]);

  // ===== send SMS code =====
  async function sendCode() {
    setErr(null);
    if (!phoneOk || sendingCode || cooldown > 0) return;
    setSendingCode(true);
    try {
      await postJSON(api('/auth/web/send_sms'), { phone, scene: 'login' });
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((s) => { if (s <= 1) { clearInterval(timer); return 0; } return s - 1; });
      }, 1000);
    } catch (e: any) {
      setErr(e?.message || '验证码发送失败');
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
        // 直接调用短信登录接口（后端需提供）
        const resp = await postJSON<any>(api('/auth/web/login_sms'), { phone, sms_code: code });
        saveAuth(resp);
      }

      // ✅ 主动广播 storage 事件，唤醒其他组件（Header）刷新
      try { window.dispatchEvent(new StorageEvent('storage', { key: 'me' })); } catch {}

      router.replace(redirect);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${brand.bg} text-[${brand.textMain}] flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md rounded-3xl border ${brand.cardBorder} bg-white shadow-[0_10px_30px_rgba(168,50,50,0.12)] backdrop-blur`}>
        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0e8] border border-[#f2c7a1]">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight" style={{ color: brand.primary }}>登录</h1>
            <p className="text-sm" style={{ color: brand.textSub }}>选择登录方式并填写信息</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 rounded-2xl bg-[#fff3e3] p-1">
            <button type="button" onClick={() => setMode('password')} className={`rounded-xl py-2 text-sm font-medium transition ${mode==='password' ? 'bg-white shadow' : 'opacity-70 hover:opacity-100'}`}>邮箱密码</button>
            <button type="button" onClick={() => setMode('sms')} className={`rounded-xl py-2 text-sm font-medium transition ${mode==='sms' ? 'bg-white shadow' : 'opacity-70 hover:opacity-100'}`}>手机验证码</button>
          </div>
        </div>

        {/* Alerts */}
        {err && <div role="alert" className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {mode==='password' ? (
            <>
              {/* Email */}
              <div>
                <label className="block text-sm mb-1" style={{ color: brand.textSub }}>邮箱</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{ ['--tw-ring-color' as any]: brand.primary }}>
                  <Mail className="h-4 w-4 opacity-80" />
                  <input className="w-full bg-transparent outline-none placeholder:text-[#b5856f]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" inputMode="email" autoComplete="email" />
                </div>
                {!emailOk && email.length>0 && (<div className="mt-1 text-xs text-red-600">邮箱格式不正确</div>)}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm mb-1" style={{ color: brand.textSub }}>密码</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{ ['--tw-ring-color' as any]: brand.primary }}>
                  <Lock className="h-4 w-4 opacity-80" />
                  <input className="w-full bg-transparent outline-none placeholder:text-[#b5856f]" value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="输入密码" autoComplete="current-password" />
                  <button type="button" aria-label={showPw ? '隐藏密码' : '显示密码'} className="p-1 rounded-lg hover:bg-[#ffeede]" onClick={() => setShowPw(v => !v)}>{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm"><a href="/forgot" className="underline underline-offset-4" style={{ color: brand.primary }}>忘记密码？</a></div>
            </>
          ) : (
            <>
              {/* Phone */}
              <div>
                <label className="block text-sm mb-1" style={{ color: brand.textSub }}>手机号</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{ ['--tw-ring-color' as any]: brand.primary }}>
                  <Phone className="h-4 w-4 opacity-80" />
                  <input className="w-full bg-transparent outline-none placeholder:text-[#b5856f]" value={phone} onChange={(e)=>setPhone(e.target.value.trim())} placeholder="支持 +区号 或 11位大陆号码" inputMode="tel" autoComplete="tel" />
                </div>
                {!phoneOk && phone.length>0 && (<div className="mt-1 text-xs text-red-600">手机号格式不正确</div>)}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm mb-1" style={{ color: brand.textSub }}>验证码</label>
                <div className="flex gap-2">
                  <div className={`flex-1 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{ ['--tw-ring-color' as any]: brand.primary }}>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 opacity-80" />
                      <input className="w-full bg-transparent outline-none placeholder:text-[#b5856f]" value={code} onChange={(e)=>setCode(e.target.value.trim())} placeholder="输入短信验证码" inputMode="numeric" pattern="\\d*" />
                    </div>
                  </div>
                  <button type="button" onClick={sendCode} disabled={!phoneOk || sendingCode || cooldown > 0} className="shrink-0 rounded-2xl px-3 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: brand.primary }}>
                    {cooldown > 0 ? `${cooldown}s` : (sendingCode ? '发送中…' : '发送验证码')}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button type="submit" disabled={!canSubmit} className="w-full inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium text-white shadow-sm transition disabled:opacity-60" style={{ backgroundColor: brand.primary }} onMouseEnter={(e) => ((e.currentTarget.style.backgroundColor = brand.primaryHover))} onMouseLeave={(e) => ((e.currentTarget.style.backgroundColor = brand.primary))}>
            {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 登录中…</>) : '登录'}
          </button>

          {/* Footer */}
          <div className="text-sm text-center" style={{ color: brand.textSub }}>
            还没有账号？
            <a className="ml-1 underline underline-offset-4" style={{ color: brand.primary }} href="/register">去注册</a>
          </div>
        </form>
      </div>
    </div>
  );
}
