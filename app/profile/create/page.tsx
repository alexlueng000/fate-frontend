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
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="text-neutral-500 tracking-widest text-sm">加载中...</div>
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

      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建档案失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Decorative right panel */}
        <div className="hidden lg:block absolute right-0 top-0 w-72 h-64 bg-[#E8DDD0] rounded-bl-3xl opacity-60" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 pb-6">
          {/* Title block */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-800 mb-3 tracking-tight">
              完善个人档案
            </h1>
            <p className="text-sm sm:text-base text-neutral-500 mb-4">
              填写出生信息，洞见命理玄机
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-16 bg-neutral-300" />
              <span className="text-[10px] tracking-[0.3em] text-neutral-400 font-medium">一盏大师</span>
              <span className="h-px w-16 bg-neutral-300" />
            </div>
          </div>

          {/* Main card */}
          <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 sm:p-8 space-y-7">

            {/* Gender */}
            <div>
              <p className="text-[10px] tracking-[0.2em] font-semibold text-[#a83232] mb-3">
                性别
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([['男', '♂', '乾·男'], ['女', '♀', '坤·女']] as const).map(([val, sym, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setGender(val)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      gender === val
                        ? 'border-[#a83232] bg-[#a83232]/8 text-[#a83232]'
                        : 'border-[#D9CFC4] bg-white text-neutral-500 hover:border-[#C5B9AE]'
                    }`}
                  >
                    <span className="text-base">{sym}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar type */}
            <div>
              <p className="text-[10px] tracking-[0.2em] font-semibold text-[#a83232] mb-3">
                历法类型
              </p>
              <div className="flex gap-6">
                {(['公历', '农历'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        calendarType === type ? 'border-[#a83232]' : 'border-[#C5B9AE] group-hover:border-[#a83232]/60'
                      }`}
                      onClick={() => setCalendarType(type)}
                    >
                      {calendarType === type && (
                        <span className="w-2 h-2 rounded-full bg-[#a83232]" />
                      )}
                    </span>
                    <span
                      className={`text-sm ${calendarType === type ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}
                      onClick={() => setCalendarType(type)}
                    >
                      {type === '公历' ? '公历' : '农历'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date + Time side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] tracking-[0.2em] font-semibold text-[#a83232] mb-3">
                  出生日期
                </p>
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
                <p className="text-[10px] tracking-[0.2em] font-semibold text-[#a83232] mb-3">
                  出生时辰
                </p>
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
              <p className="text-[10px] tracking-[0.2em] font-semibold text-[#a83232] mb-3">
                出生地点
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={birthLocation}
                  onChange={(e) => setBirthLocation(e.target.value)}
                  placeholder="搜索城市或坐标..."
                  className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-[#D9CFC4] bg-white text-neutral-700 placeholder:text-neutral-400 focus:border-[#a83232] focus:outline-none transition-colors text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  📍
                </span>
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                精准定位，用于计算真太阳时
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-[#a83232] hover:bg-[#8c2b2b] active:bg-[#7a2626] text-white font-semibold text-base tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {submitting ? '创建中...' : '开启命理之行'}
            </button>

            <p className="text-center text-[11px] text-neutral-400 -mt-2">
              📜 正在推演四柱八字
            </p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
            <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl p-5">
              <h3 className="text-base font-semibold text-neutral-700 mb-2">千年古法传承</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                算法严格依据清代《钦定协纪辨方书》等典籍整理而成，确保每一柱干支均以古法精准推算。
              </p>
            </div>
            <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl p-5">
              <h3 className="text-base font-semibold text-neutral-700 mb-2">现代精算加持</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                结合真太阳时与本地天文数据，为您呈现兼具传统精髓与现代精度的八字命盘。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
