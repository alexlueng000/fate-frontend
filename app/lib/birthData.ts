import { api } from './api';
import { getAuthToken } from './auth';

export interface DefaultBirthData {
  gender: '男' | '女';
  calendar: 'gregorian' | 'lunar';
  birthDate: string;      // YYYY-MM-DD
  birthTime: string;      // HH:MM
  birthPlace: string;     // 城市名
}

const STORAGE_KEY = 'default_birth_data';

/**
 * 加载默认命盘数据
 * - 已登录用户：从服务器获取
 * - 未登录用户：从 localStorage 获取
 */
export async function loadDefaultBirthData(): Promise<DefaultBirthData | null> {
  const token = getAuthToken();

  // 已登录：从服务器获取
  if (token) {
    try {
      const resp = await fetch(api('/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const user = await resp.json();
        if (user.default_birth_data) {
          const data = JSON.parse(user.default_birth_data);
          // 转换字段名（后端用下划线，前端用驼峰）
          return {
            gender: data.gender,
            calendar: data.calendar,
            birthDate: data.birth_date,
            birthTime: data.birth_time,
            birthPlace: data.birth_place,
          };
        }
      }
    } catch (e) {
      console.error('Failed to load default birth data from server:', e);
    }
  }

  // 未登录或服务器无数据：从 localStorage 获取
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : null;
  }

  return null;
}

/**
 * 保存默认命盘数据
 * - 始终保存到 localStorage
 * - 已登录用户：同步到服务器
 */
export async function saveDefaultBirthData(data: DefaultBirthData): Promise<boolean> {
  // 始终保存到 localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // 已登录：同步到服务器
  const token = getAuthToken();
  if (token) {
    try {
      const resp = await fetch(api('/me/default-birth-data'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gender: data.gender,
          calendar: data.calendar,
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          birth_place: data.birthPlace
        })
      });
      if (!resp.ok) {
        console.error('Failed to save default birth data to server:', await resp.text());
        return false;
      }
    } catch (e) {
      console.error('Failed to save default birth data to server:', e);
      return false;
    }
  }

  return true;
}

/**
 * 清除默认命盘数据
 */
export async function clearDefaultBirthData(): Promise<void> {
  // 清除 localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }

  // 已登录：同步清除服务器数据
  const token = getAuthToken();
  if (token) {
    try {
      await fetch(api('/me/default-birth-data'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to clear default birth data from server:', e);
    }
  }
}
