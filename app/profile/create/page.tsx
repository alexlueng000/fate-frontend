'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { PrettyDateField } from '@/app/components/Calender';
import { IOSWheelTime } from '@/app/components/TimePicker';

export default function CreateProfilePage() {
  const router = useRouter();
  const loading = useRouteGuard(true, false); // 需要登录，不需要档案

  const [gender, setGender] = useState<'男' | '女'>('男');
  const [calendarType, setCalendarType] = useState<'公历' | '农历'>('公历');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <div className="text-neutral-600">加载中...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证必填字段
    if (!birthDate) {
      setError('请选择出生日期');
      return;
    }
    if (!birthTime) {
      setError('请选择出生时间');
      return;
    }
    if (!birthLocation.trim()) {
      setError('请输入出生地点');
      return;
    }

    setSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('未登录，请重新登录');
        return;
      }

      const response = await fetch(api('/profile/create'), {
        method: 'POST',
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
        let errorMsg = '创建档案失败';
        try {
          const json = JSON.parse(text);
          errorMsg = json.detail || json.message || errorMsg;
        } catch {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // 创建成功，跳转到聊天页
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建档案失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F3EE] text-neutral-800 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">完善个人档案</h1>
          <p className="text-neutral-600">请填写您的出生信息，系统将为您生成专属命盘</p>
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

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-xl bg-[#a83232] hover:bg-[#8c2b2b] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '创建中...' : '创建档案'}
          </button>
        </form>

        {/* 提示信息 */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          档案创建后，您可以随时在个人中心修改
        </div>
      </div>
    </main>
  );
}
