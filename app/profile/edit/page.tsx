'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { PrettyDateField } from '@/app/components/Calender';
import { IOSWheelTime } from '@/app/components/TimePicker';

interface UserProfile {
  id: number;
  user_id: number;
  gender: string;
  calendar_type: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  bazi_year: string;
  bazi_month: string;
  bazi_day: string;
  bazi_hour: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const loading = useRouteGuard(true, true); // 需要登录和档案

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  const [gender, setGender] = useState<'男' | '女'>('男');
  const [calendarType, setCalendarType] = useState<'公历' | '农历'>('公历');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (loading) return;

    const fetchProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('未登录');
          return;
        }

        const response = await fetch(api('/profile/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('获取档案失败');
        }

        const data = await response.json();
        setProfile(data);
        setGender(data.gender);
        setCalendarType(data.calendar_type);
        setBirthDate(data.birth_date);
        setBirthTime(data.birth_time);
        setBirthLocation(data.birth_location);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取档案失败');
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!birthDate || !birthTime || !birthLocation.trim()) {
      setError('请填写完整信息');
      return;
    }

    setSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('未登录，请重新登录');
        return;
      }

      const response = await fetch(api('/profile/update'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          gender,
          calendar_type: calendarType,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_location: birthLocation,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = '更新档案失败';
        try {
          const json = JSON.parse(text);
          errorMsg = json.detail || json.message || errorMsg;
        } catch {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      router.push('/profile/view');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新档案失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('未登录，请重新登录');
        return;
      }

      const response = await fetch(api('/profile/delete'), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('删除档案失败');
      }

      // 删除成功，跳转到建档页
      router.push('/profile/create');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除档案失败');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <div className="text-neutral-600">加载中...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-2 rounded-xl bg-[#a83232] text-white hover:bg-[#8c2b2b] transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EE] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-neutral-600 hover:text-neutral-900 mb-4 flex items-center gap-2"
          >
            <span>←</span> 返回
          </button>
          <h1 className="text-3xl font-bold text-neutral-900">修改个人档案</h1>
          <p className="text-neutral-600 mt-2">修改关键信息后，系统将自动重新计算命盘</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 space-y-6">
          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              性别 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('男')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  gender === '男'
                    ? 'border-[#a83232] bg-[#a83232]/5 text-[#a83232] font-semibold'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                男
              </button>
              <button
                type="button"
                onClick={() => setGender('女')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  gender === '女'
                    ? 'border-[#a83232] bg-[#a83232]/5 text-[#a83232] font-semibold'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                女
              </button>
            </div>
          </div>

          {/* 历法类型 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              历法类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCalendarType('公历')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  calendarType === '公历'
                    ? 'border-[#a83232] bg-[#a83232]/5 text-[#a83232] font-semibold'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                公历
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('农历')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  calendarType === '农历'
                    ? 'border-[#a83232] bg-[#a83232]/5 text-[#a83232] font-semibold'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                }`}
              >
                农历
              </button>
            </div>
          </div>

          {/* 出生日期 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              出生日期 <span className="text-red-500">*</span>
            </label>
            <PrettyDateField
              value={birthDate}
              onChange={setBirthDate}
              placeholder="选择日期"
              theme="panel"
              showPresets={false}
              helper=""
            />
          </div>

          {/* 出生时间 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              出生时间 <span className="text-red-500">*</span>
            </label>
            <IOSWheelTime
              value={birthTime}
              onChange={setBirthTime}
              placeholder="选择时间"
              theme="panel"
            />
          </div>

          {/* 出生地点 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              出生地点 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={birthLocation}
              onChange={(e) => setBirthLocation(e.target.value)}
              placeholder="例如：北京市"
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-[#a83232] focus:outline-none transition-colors"
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              请输入出生城市，用于计算真太阳时
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 px-6 rounded-xl bg-[#a83232] hover:bg-[#8c2b2b] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '保存中...' : '保存修改'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-4 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors font-semibold"
            >
              删除档案
            </button>
          </div>
        </form>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">确认删除档案？</h3>
            <p className="text-neutral-600 mb-6">
              删除后，您的个人档案和命盘信息将被永久删除，无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors font-semibold disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
