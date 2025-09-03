// lib/auth.ts
import { api, postJSON } from './api';

export type User = {
  id: number;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

export type LoginReq = { email: string; password: string };
export type LoginResp = {
  user: User;
  access_token?: string;
  token_type?: string;
};

export async function loginWeb(payload: LoginReq): Promise<LoginResp> {
  return postJSON<LoginResp>(api('/auth/web/login'), payload);
}

export function saveAuth(resp: LoginResp) {
  if (resp.access_token) localStorage.setItem('auth_token', resp.access_token);
  sessionStorage.setItem('me', JSON.stringify(resp.user));
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
  sessionStorage.removeItem('me');
}

// 可选：如果你是 Cookie 会话制，后端提供 /me、/logout
export async function fetchMe(): Promise<User | null> {
  try {
    const r = await fetch(api('/me'), { credentials: 'include' });
    if (!r.ok) return null;
    const u = (await r.json()) as User;
    sessionStorage.setItem('me', JSON.stringify(u));
    return u;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  // 如果后端有 /auth/logout，就调用它（Cookie 会话）
  try {
    await fetch(api('/auth/logout'), { method: 'POST', credentials: 'include' });
  } catch {}
  clearAuth();
}
