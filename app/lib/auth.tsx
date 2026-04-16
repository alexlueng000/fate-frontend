'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type ReactElement,   // ✅ 新增
} from 'react';
import { api } from './api';
import { clearAllChatData } from './chat/storage';

export type User = {
  id: number;
  username: string;
  nickname?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  is_admin?: boolean;
  has_profile?: boolean;
  profile_brief?: {
    id: number;
    gender: string;
    birth_date: string;
    birth_time: string;
    birth_location: string;
    display_info: string;
  } | null;
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

export function UserProvider({ children }: { children: ReactNode }): ReactElement {
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
  // SSR 安全检查
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return;
  }
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
  }).catch((err: unknown) => {
    throw new Error(`网络错误：${(err as Error)?.message || '可能是 CORS/域名/协议问题'}`);
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    // 尝试解析 JSON 格式的错误响应
    let errorMsg = '服务器返回错误';
    if (text) {
      try {
        const json = JSON.parse(text);
        errorMsg = json.detail || json.message || errorMsg;
      } catch {
        errorMsg = text;
      }
    }
    throw new Error(errorMsg);
  }

  const data = await resp.json().catch(() => null);
  if (!data) throw new Error('服务器返回了无效的 JSON');

  return data as LoginResp;
}

export function saveAuth(resp: LoginResp) {
  // SSR 安全检查
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    if (resp.access_token) localStorage.setItem('auth_token', resp.access_token);
  }
  // 重置 fetchMe 状态，允许重新获取用户信息
  resetFetchMeState();
  setUserCache(resp.user);
}

export function currentUser(): User | null {
  // SSR 安全检查
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem('me');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  // SSR 安全检查
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
  // 清理所有聊天相关数据
  clearAllChatData();
  // 重置 fetchMe 状态
  resetFetchMeState();
  setUserCache(null);
}

export function getAuthToken(): string | null {
  // SSR 安全检查
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

// 防止重复请求的标记
let _fetchMePromise: Promise<User | null> | null = null;
let _fetchMeAttempted = false;

export async function fetchMe(): Promise<User | null> {
  // 如果已经尝试过且没有 token，直接返回 null
  const token = getAuthToken();
  if (_fetchMeAttempted && !token) {
    return null;
  }

  // 如果正在请求中，返回同一个 Promise
  if (_fetchMePromise) {
    return _fetchMePromise;
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  _fetchMePromise = (async () => {
    try {
      const resp = await fetch(api('/me'), { headers, credentials: 'include' });
      _fetchMeAttempted = true;
      if (!resp.ok) return null;
      return (await resp.json()) as User;
    } catch {
      _fetchMeAttempted = true;
      return null;
    } finally {
      _fetchMePromise = null;
    }
  })();

  return _fetchMePromise;
}

// 重置 fetchMe 状态（登录/登出时调用）
export function resetFetchMeState() {
  _fetchMePromise = null;
  _fetchMeAttempted = false;
}

export async function logout(): Promise<void> {
  // 若后端有 /auth/logout，可在此调用
  clearAuth();
}

// ===================== 档案状态检查 =====================

export type ProfileStatus = {
  hasProfile: boolean;
  profileBrief?: {
    id: number;
    gender: string;
    birth_date: string;
    birth_time: string;
    birth_location: string;
    display_info: string;
  } | null;
};

/**
 * 检查用户档案状态
 * 从 /api/auth/me 获取 has_profile 和 profile_brief
 */
export async function checkProfileStatus(): Promise<ProfileStatus | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const resp = await fetch(api('/auth/me'), { headers, credentials: 'include' });
    if (!resp.ok) return null;

    const data = await resp.json() as User;
    return {
      hasProfile: data.has_profile ?? false,
      profileBrief: data.profile_brief ?? null,
    };
  } catch {
    return null;
  }
}

// ===================== 路由守卫 Hook =====================

export type RouteGuardResult =
  | { allowed: true }
  | { allowed: false; redirect: '/login' | '/profile/create' | '/chat' };

/**
 * 路由守卫：检查用户登录态和建档态
 *
 * @param requireAuth - 是否需要登录
 * @param requireProfile - 是否需要建档
 * @returns 是否允许访问，以及重定向路径
 */
export async function checkRouteAccess(
  requireAuth: boolean = false,
  requireProfile: boolean = false
): Promise<RouteGuardResult> {
  const token = getAuthToken();

  // 需要登录但未登录
  if (requireAuth && !token) {
    return { allowed: false, redirect: '/login' };
  }

  // 不需要登录，直接放行
  if (!requireAuth) {
    return { allowed: true };
  }

  // 需要建档，检查档案状态
  if (requireProfile) {
    const status = await checkProfileStatus();
    if (!status) {
      return { allowed: false, redirect: '/login' };
    }
    if (!status.hasProfile) {
      return { allowed: false, redirect: '/profile/create' };
    }
  }

  return { allowed: true };
}
