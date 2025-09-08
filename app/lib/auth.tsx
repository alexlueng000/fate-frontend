'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';

export type User = {
  id: number;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

export type LoginResp = {
  user: User;
  access_token?: string;
  token_type?: string;
};

export type UserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
};

// 注意：这是“值”，不是“类型”
const UserCtx = createContext<UserContextType | undefined>(undefined);

let setUserRef: (u: User | null) => void = () => {};

export function UserProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(currentUser());

  useEffect(() => { setUserRef = setUser; }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'me' || e.key === 'auth_token') setUser(currentUser());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return <UserCtx.Provider value={{ user, setUser }}>{children}</UserCtx.Provider>;
}

export function useUser(): UserContextType {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export function setUserCache(u: User | null) {
  if (u) {
    try { sessionStorage.setItem('me', JSON.stringify(u)); } catch {}
  } else {
    sessionStorage.removeItem('me');
  }
  setUserRef(u);
}

export async function loginWeb(payload: { email: string; password: string }) {
  const resp = await fetch(api('/auth/web/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  }).catch((err: any) => {
    throw new Error(`网络错误：${err?.message || '可能是 CORS/域名/协议问题'}`);
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`登录失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
  }

  const data = await resp.json().catch(() => null);
  if (!data) throw new Error('服务器返回了无效的 JSON');

  return data as LoginResp;
}

export function saveAuth(resp: LoginResp) {
  if (resp.access_token) localStorage.setItem('auth_token', resp.access_token);
  setUserCache(resp.user);
}

export function currentUser(): User | null {
  try {
    const raw = sessionStorage.getItem('me');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem('auth_token');
  setUserCache(null);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export async function fetchMe(): Promise<User | null> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const resp = await fetch(api('/me'), { headers, credentials: 'include' });
    if (!resp.ok) return null;
    return (await resp.json()) as User;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  // 若后端有 /auth/logout，可在此调用
  clearAuth();
}
