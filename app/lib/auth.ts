// lib/auth.ts
import { api, postJSON } from './api';
import { clearChatStorage } from './chat/storage';

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

export async function loginWeb(payload: { email: string; password: string }) {
  let resp: Response;
  try {
    resp = await fetch(api('/auth/web/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 关键：让后端的 Set-Cookie 生效
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    // 只有“网络层失败/CORS/被阻止”才会走到这里
    throw new Error(`网络错误：${err?.message || 'Failed to fetch（多半是 CORS 或协议/域名不一致）'}`);
  }

  // HTTP 层错误：给出更可读的报错
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`登录失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
  }

  // 正常 JSON
  const data = await resp.json().catch(() => null);
  if (!data) throw new Error('服务器返回了无效的 JSON');

  return data;
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
  // 鉴权相关
  try {
    localStorage.removeItem('auth_token'); // 你现在用的这个
    localStorage.removeItem('auth_user');  // 如果也存了用户对象，一并清掉（有则删，无则忽略）
  } catch {}

  // 你提到的 sessionStorage['me']
  try {
    sessionStorage.removeItem('me');
  } catch {}

  // 聊天侧缓存（会话ID、命盘、消息等）
  clearChatStorage();

  // 通知其它组件（Header 等）刷新
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user' }));
  } catch {}
}

// 读取本地 token
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}


// 可选：如果你是 Cookie 会话制，后端提供 /me、/logout
export async function fetchMe(): Promise<User | null> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    // 注意：你的 me 路由是在 auth 路由器下，路径应是 /auth/me
    const resp = await fetch(api('/me'), { headers });
    if (!resp.ok) return null;
    return (await resp.json()) as User;
  } catch {
    return null;
  }
}
export async function logout(): Promise<void> {
  // 如果后端有 /auth/logout，就调用它（Cookie 会话）
  // try {
  //   await fetch(api('/auth/logout'), { method: 'POST', credentials: 'include' });
  // } catch {}
  clearAuth();
}
