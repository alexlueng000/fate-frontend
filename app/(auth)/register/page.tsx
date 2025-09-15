'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJSON, api } from '@/app/lib/api';
import { saveAuth, setUserCache } from '@/app/lib/auth';
import { Mail, User as UserIcon, Lock, Eye, EyeOff, Loader2, ShieldCheck, Phone, Hash } from 'lucide-react';

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

const brand = {
  bg: 'from-[#fffaf1] via-[#fff5e6] to-[#ffe9d6]',
  cardBorder: 'border-[#e5c07b]',
  primary: '#a83232',
  primaryHover: '#8c2b2b',
  textMain: '#4a2c2a',
  textSub: '#7b4b3a',
};

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
        saveAuth(resp as any);
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
          id: (resp as any).id ?? 0,
          username: (resp as any).username ?? username,
          nickname: (resp as any).nickname ?? nickname,
          avatar_url: (resp as any).avatar_url ?? null,
          email: (resp as any).email ?? email,
        };
        setUserCache(fallbackUser);
      }

      setOk('注册成功，正在为你跳转…');
      router.replace('/');
    } catch (e: any) {
      setErr(e?.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${brand.bg} text-[${brand.textMain}] flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md rounded-3xl border ${brand.cardBorder} bg-white shadow-[0_10px_30px_rgba(168,50,50,0.12)] backdrop-blur`}>
        <div className="px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0e8] border border-[#f2c7a1]">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight" style={{color: brand.primary}}>创建账户</h1>
            <p className="text-sm" style={{color: brand.textSub}}>请选择注册方式</p>
          </div>
        </div>

        {err && (
          <div role="alert" className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
        )}
        {ok && (
          <div role="status" className="mx-6 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="flex gap-2 text-sm" style={{color: brand.textSub}}>
            <button type="button" onClick={() => setMode('account')} className={`px-3 py-1 rounded-full border ${mode==='account'?'bg-[#a83232] text-white':'bg-[#fff7ec]'}`}>账号注册</button>
            <button type="button" onClick={() => setMode('phone')} className={`px-3 py-1 rounded-full border ${mode==='phone'?'bg-[#a83232] text-white':'bg-[#fff7ec]'}`}>手机注册</button>
          </div>

          {mode==='account' && (
            <>
              <div>
                <label className="block text-sm mb-1" style={{color: brand.textSub}}>邮箱</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 focus-within:ring-2`} style={{['--tw-ring-color' as any]: brand.primary}}>
                  <Mail className="h-4 w-4 opacity-80" />
                  <input
                    className="w-full bg-transparent outline-none placeholder:text-[#b5856f]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: brand.textSub}}>用户名</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2`}>
                  <UserIcon className="h-4 w-4 opacity-80" />
                  <input className="w-full bg-transparent outline-none" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="至少3个字符" autoComplete="username" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: brand.textSub}}>密码</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2`}>
                  <Lock className="h-4 w-4 opacity-80" />
                  <input className="w-full bg-transparent outline-none" value={password} onChange={(e)=>setPassword(e.target.value)} type={showPw?'text':'password'} placeholder="至少8位" autoComplete="new-password" />
                  <button type="button" onClick={()=>setShowPw(v=>!v)}>{showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
                </div>
                <div className="mt-2">
                  <div className="h-2 w-full rounded-full bg-[#f5e6d6] overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${(pwStrength.score / 4) * 100}%`, backgroundColor: pwStrength.score >= 3 ? '#22c55e' : pwStrength.score === 2 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <div className="mt-1 text-xs" style={{ color: brand.textSub }}>密码强度：{pwStrength.label}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: brand.textSub}}>昵称（可选）</label>
                <input className={`w-full rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2 outline-none`} value={nickname} onChange={(e)=>setNickname(e.target.value)} placeholder="展示给其他用户的称呼" />
              </div>
            </>
          )}

          {mode==='phone' && (
            <>
              <div>
                <label className="block text-sm mb-1" style={{color: brand.textSub}}>手机号</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2`}>
                  <Phone className="h-4 w-4 opacity-80" />
                  <input className="w-full bg-transparent outline-none" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="11位手机号" inputMode="numeric" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{color: brand.textSub}}>验证码</label>
                <div className={`flex items-center gap-2 rounded-2xl border ${brand.cardBorder} bg-[#fff7ec] px-3 py-2`}>
                  <Hash className="h-4 w-4 opacity-80" />
                  <input className="w-full bg-transparent outline-none" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="输入短信验证码" />
                  <button type="button" className="text-xs text-[#a83232]">获取验证码</button>
                </div>
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm select-none">
            <input type="checkbox" className="accent-[#a83232] h-4 w-4" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
            <span style={{color: brand.textSub}}>
              我已阅读并同意
              <a href="/terms" className="mx-1 underline underline-offset-4 text-[#a83232]">服务条款</a>
              与
              <a href="/privacy" className="ml-1 underline underline-offset-4 text-[#a83232]">隐私政策</a>
            </span>
          </label>

          <button type="submit" disabled={!canSubmit} className="w-full inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium text-white shadow-sm transition disabled:opacity-60" style={{backgroundColor:brand.primary}}>
            {submitting?(<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>注册中…</>):'注册'}
          </button>

          <div className="text-sm text-center" style={{color:brand.textSub}}>
            已有账号？<a href="/login" className="ml-1 underline underline-offset-4 text-[#a83232]">去登录</a>
          </div>
        </form>
      </div>
    </div>
  );
}
