'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { PrettyDateField } from '@/app/components/Calender';
import { IOSWheelTime } from '@/app/components/TimePicker';
import { MapPin } from 'lucide-react';

export default function CreateProfilePage() {
  const router = useRouter();
  const loading = useRouteGuard(true, false);

  const [gender, setGender] = useState<'男' | '女'>('男');
  const [calendarType, setCalendarType] = useState<'公历' | '农历'>('公历');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]" role="status" aria-live="polite">加载中...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!birthDate) { setError('请选择出生日期'); return; }
    if (!birthTime) { setError('请选择出生时间'); return; }
    if (!birthLocation.trim()) { setError('请输入出生地点'); return; }

    setSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) { setError('未登录，请重新登录'); return; }

      const response = await fetch(api('/profile/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          gender: gender === '男' ? 'male' : 'female',
          calendar_type: calendarType === '公历' ? 'solar' : 'lunar',
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
          // Handle Pydantic validation errors
          if (json.detail) {
            if (Array.isArray(json.detail)) {
              errorMsg = json.detail.map((err: any) => err.msg || JSON.stringify(err)).join('; ');
            } else if (typeof json.detail === 'string') {
              errorMsg = json.detail;
            } else {
              errorMsg = JSON.stringify(json.detail);
            }
          } else {
            errorMsg = json.message || errorMsg;
          }
        } catch { errorMsg = text || errorMsg; }
        throw new Error(errorMsg);
      }

      router.push('/report');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建档案失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Title block */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text-primary)] mb-3 font-serif" style={{ fontFamily: 'var(--font-display)' }}>
            完善个人档案
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
            填写出生信息，洞见命理玄机
          </p>
        </div>

        {/* Main card */}
        <form onSubmit={handleSubmit} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-md)] p-6 sm:p-8 space-y-6">

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-3">
              性别 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="性别选择">
              {(['男', '女'] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGender(val)}
                  aria-pressed={gender === val}
                  className={`py-4 px-4 rounded-md border-2 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 ${
                    gender === val
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar type */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-3">
              历法类型 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <div className="flex gap-6" role="radiogroup" aria-label="历法类型选择">
              {(['公历', '农历'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer group min-h-[44px]">
                  <input
                    type="radio"
                    name="calendarType"
                    value={type}
                    checked={calendarType === type}
                    onChange={() => setCalendarType(type)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      calendarType === type ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-strong)] group-hover:border-[var(--color-primary)]/60'
                    }`}
                  >
                    {calendarType === type && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${calendarType === type ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'}`}
                  >
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date + Time side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                出生日期 <span className="text-[var(--color-primary)]">*</span>
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
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                出生时辰 <span className="text-[var(--color-primary)]">*</span>
              </label>
              <IOSWheelTime
                value={birthTime}
                onChange={setBirthTime}
                placeholder="选择时间"
                theme="panel"
              />
            </div>
          </div>

          {/* Birth location */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-3">
              出生地点 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-hint)]" />
              <input
                type="text"
                value={birthLocation}
                onChange={(e) => setBirthLocation(e.target.value)}
                placeholder="搜索城市或坐标"
                className="w-full pl-10 pr-4 py-3 rounded-md border-2 border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/24 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] text-sm"
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              精准定位，用于计算真太阳时
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 p-3 text-sm text-[var(--color-primary)]" role="alert">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-md bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-inverse)] font-semibold text-base transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 min-h-[44px]"
          >
            {submitting ? '创建中...' : '完成建档'}
          </button>

          <p className="text-center text-xs text-[var(--color-text-muted)]">
            正在推演四柱八字
          </p>
        </form>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-5">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">传统算法</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              依据传统典籍整理而成，确保每一柱干支均以古法精准推算
            </p>
          </div>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-5">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">现代精算</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              结合真太阳时与本地天文数据，呈现精准的八字命盘
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
