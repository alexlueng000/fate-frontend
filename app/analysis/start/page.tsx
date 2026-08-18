'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Loader2, MapPin, ShieldCheck } from 'lucide-react';

import { startGuestAnalysis } from '@/app/lib/api';
import { trackEvent } from '@/app/lib/analytics/track';
import { getGuestSessionId } from '@/app/lib/guestSession';

type Gender = 'male' | 'female';
type CalendarType = 'solar' | 'lunar';
type FieldErrors = Partial<Record<'birthDate' | 'birthTime' | 'birthLocation', string>>;

export default function GuestAnalysisStartPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    trackEvent('guest_analysis_start_view', { payload: { entry: 'analysis_start' } });
  }, []);

  const canSubmit = useMemo(() => {
    return birthDate.trim() && birthTime.trim() && birthLocation.trim() && !submitting;
  }, [birthDate, birthLocation, birthTime, submitting]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!birthDate) next.birthDate = '请选择出生日期';
    if (!birthTime) next.birthTime = '请选择出生时间';
    if (!birthLocation.trim()) next.birthLocation = '请输入出生地点';
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('请先补全标记的信息');
      return;
    }

    setSubmitting(true);
    trackEvent('guest_analysis_submit', {
      payload: { calendar_type: calendarType, has_display_name: Boolean(displayName.trim()) },
    });
    try {
      const result = await startGuestAnalysis({
        guest_session_id: getGuestSessionId(),
        display_name: displayName.trim() || null,
        gender,
        calendar_type: calendarType,
        birth_date: birthDate,
        birth_time: birthTime.length === 5 ? `${birthTime}:00` : birthTime,
        birth_location: birthLocation.trim(),
        timezone: 'Asia/Shanghai',
      });

      trackEvent('guest_analysis_created', {
        payload: { public_id: result.public_id, status: result.status },
      });
      router.push(`/analysis/result/${result.public_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败，请稍后重试';
      setError(message);
      trackEvent('guest_analysis_create_failed', {
        payload: { error: message.slice(0, 120) },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <section className="lg:pt-6">
          <p className="text-sm text-[var(--color-text-muted)]">首次个人分析</p>
          <h1
            className="mt-3 max-w-xl text-3xl font-medium leading-tight text-[var(--color-text-primary)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            先看见自己，再决定要不要继续聊
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--color-text-body)]">
            不需要注册。填写出生信息后，系统会先生成一份基础命盘和首次解读。内容只作为传统文化、自我观察和娱乐参考。
          </p>

          <div className="mt-8 space-y-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex gap-3">
              <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                首次结果页会优先展示白话摘要，命盘细节放在后面。
              </p>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                游客每天可生成一次免费分析，登录后再保存或继续追问。
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-md)]"
        >
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
            <h2
              className="text-xl font-medium text-[var(--color-text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              出生信息
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              时间和地点越准确，排盘参考越稳定。
            </p>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-7">
            <div>
              <label htmlFor="display-name" className="mb-2 block text-sm text-[var(--color-text-secondary)]">
                称呼
              </label>
              <input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="input"
                placeholder="可不填"
                maxLength={64}
              />
            </div>

            <div>
              <span className="mb-3 block text-sm text-[var(--color-text-secondary)]">性别</span>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="性别">
                {[
                  ['female', '女'],
                  ['male', '男'],
                ].map(([value, label]) => {
                  const selected = gender === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setGender(value as Gender)}
                      className={`min-h-[48px] border px-4 py-3 text-sm transition-colors ${
                        selected
                          ? 'border-[var(--color-primary)] bg-[color-mix(in_oklch,var(--color-primary)_8%,var(--color-bg-card))] text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="calendar-type" className="mb-2 block text-sm text-[var(--color-text-secondary)]">
                历法
              </label>
              <select
                id="calendar-type"
                value={calendarType}
                onChange={(event) => setCalendarType(event.target.value as CalendarType)}
                className="input"
              >
                <option value="solar">公历</option>
                <option value="lunar">农历</option>
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="birth-date" className="mb-2 block text-sm text-[var(--color-text-secondary)]">
                  出生日期
                </label>
                <input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(event) => {
                    setBirthDate(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, birthDate: undefined }));
                  }}
                  className="input"
                  aria-invalid={Boolean(fieldErrors.birthDate)}
                />
                {fieldErrors.birthDate && (
                  <p className="mt-2 text-sm text-[var(--color-primary)]" role="alert">
                    {fieldErrors.birthDate}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="birth-time" className="mb-2 block text-sm text-[var(--color-text-secondary)]">
                  出生时间
                </label>
                <input
                  id="birth-time"
                  type="time"
                  value={birthTime}
                  onChange={(event) => {
                    setBirthTime(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, birthTime: undefined }));
                  }}
                  className="input"
                  aria-invalid={Boolean(fieldErrors.birthTime)}
                />
                {fieldErrors.birthTime && (
                  <p className="mt-2 text-sm text-[var(--color-primary)]" role="alert">
                    {fieldErrors.birthTime}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="birth-location" className="mb-2 block text-sm text-[var(--color-text-secondary)]">
                出生地点
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-hint)]" aria-hidden />
                <input
                  id="birth-location"
                  value={birthLocation}
                  onChange={(event) => {
                    setBirthLocation(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, birthLocation: undefined }));
                  }}
                  className="input pl-10"
                  placeholder="例如：广东深圳"
                  maxLength={100}
                  aria-invalid={Boolean(fieldErrors.birthLocation)}
                />
              </div>
              {fieldErrors.birthLocation && (
                <p className="mt-2 text-sm text-[var(--color-primary)]" role="alert">
                  {fieldErrors.birthLocation}
                </p>
              )}
            </div>

            {error && (
              <div
                className="border border-[color-mix(in_oklch,var(--color-primary)_32%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_7%,var(--color-bg-card))] px-4 py-3 text-sm leading-6 text-[var(--color-primary)]"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary w-full text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  正在生成
                </>
              ) : (
                <>
                  生成首次分析
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
              继续追问、保存报告和跨设备查看，需要在结果页登录。
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
