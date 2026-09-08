'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { getAuthToken, setUserCache, type User } from '@/app/lib/auth';
import ProfileWelcome from '@/app/profile/create/ProfileWelcome';
import useProfileDraft from '@/app/profile/create/useProfileDraft';
import styles from '@/app/profile/create/onboarding.module.css';
import { trackEvent } from '@/app/lib/analytics/track';
import { PrettyDateField } from '@/app/components/Calender';
import { IOSWheelTime } from '@/app/components/TimePicker';
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';

type FieldName = 'birthDate' | 'birthTime' | 'birthLocation';

const ANALYSIS_STEPS = [
  '填写出生信息',
  '生成你的命盘',
  '查看命理报告',
];

export default function ProfileSetupFlow({ user, returnTo = '/report' }: { user: User; returnTo?: string }) {
  const router = useRouter();
  const draft = useProfileDraft(user.id);
  const { gender, calendarType, birthDate, birthTime, birthLocation } = draft.fields;
  const [leaving, setLeaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusRequested = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const startedFieldsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); };
  }, []);

  useEffect(() => {
    if (!draft.started || !focusRequested.current || !formHeading.current) return;
    focusRequested.current = false;
    formHeading.current.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1023px)').matches) {
      formHeading.current.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, [draft.started]);

  function beginProfile() {
    if (leaving) return;
    focusRequested.current = true;
    setLeaving(true);
    trackEvent('profile_welcome_start');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) draft.begin();
    else transitionTimer.current = setTimeout(draft.begin, 140);
  }

  const trackFieldStart = (field: string) => {
    if (startedFieldsRef.current.has(field)) return;
    startedFieldsRef.current.add(field);
    trackEvent('profile_form_start', { payload: { field } });
  };

  useEffect(() => {
    trackEvent('profile_create_view', { payload: { has_profile: false } });
  }, []);

  if (!draft.ready || completed) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]" role="status" aria-live="polite">{completed ? '命盘已生成，正在打开解读…' : '正在准备你的空间…'}</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const nextFieldErrors: Partial<Record<FieldName, string>> = {};
    if (!birthDate) nextFieldErrors.birthDate = '请选择出生日期';
    if (!birthTime) nextFieldErrors.birthTime = '请选择出生时间';
    if (!birthLocation.trim()) nextFieldErrors.birthLocation = '请输入出生地点';

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('请先补全标记的出生信息');
      trackEvent('profile_form_submit', {
        payload: { result: 'validation_failed', error_code: Object.keys(nextFieldErrors).join(',') },
      });
      return;
    }

    setSubmitting(true);
    trackEvent('profile_form_submit', {
      payload: { calendar_type: calendarType === '公历' ? 'solar' : 'lunar' },
    });

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
              errorMsg = json.detail.map((err: unknown) => {
                if (typeof err === 'object' && err !== null && 'msg' in err) {
                  const msg = (err as { msg?: unknown }).msg;
                  if (typeof msg === 'string') return msg;
                }
                return JSON.stringify(err);
              }).join('; ');
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

      trackEvent('profile_create_success', {
        payload: { calendar_type: calendarType === '公历' ? 'solar' : 'lunar' },
      });
      setCompleted(true);
      draft.finish();
      if (user) setUserCache({ ...user, has_profile: true });
      router.push(returnTo || '/report');
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建档案失败';
      setError(message);
      trackEvent('profile_create_failed', {
        payload: { error_code: message.slice(0, 120) },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft.started) {
    return <main className="min-h-screen bg-[var(--color-bg)]"><ProfileWelcome onStart={beginProfile} leaving={leaving} /></main>;
  }

  return (
    <div className={`min-h-screen bg-[var(--color-bg)] ${leaving ? styles.formEntering : ''}`}>
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-24">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            First Analysis
          </p>
          <h1
            className="max-w-xl text-[2.25rem] font-medium leading-[1.18] text-[var(--color-text-primary)] sm:text-[3rem] lg:text-[3.25rem]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            先从你的出生信息开始
          </h1>
          <p className="mt-5 max-w-md text-[1rem] leading-8 text-[var(--color-text-body)]">
            只需要一次填写。之后命理报告、八字对话和每日提醒，都会基于这份命盘展开。
          </p>

          <ol className="mt-10 space-y-4 border-t border-[var(--color-border)] pt-6">
            {ANALYSIS_STEPS.map((step, index) => (
              <li key={step} className="grid grid-cols-[auto_1fr] items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] font-mono text-[11px] text-[var(--color-primary)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-9 space-y-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                出生日期、时间和地点先用于确定命盘，再进入 AI 解读环节。
              </p>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                内容仅供文化研究、娱乐与个人参考，不构成医疗、投资、法律或其他专业建议。
              </p>
            </div>
          </div>
        </section>

        {/* Main card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
        >
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  Birth Profile
                </p>
                <h2
                  ref={formHeading}
                  tabIndex={-1}
                  className={`${styles.formHeading} mt-2 text-xl font-medium text-[var(--color-text-primary)]`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  出生信息
                </h2>
              </div>
              <p className="text-xs leading-5 text-[var(--color-text-muted)]">
                约 1 分钟完成
              </p>
            </div>
          </div>

          <div className={styles.draftNotice}>
            <p role="status">{draft.canSave ? '草稿仅保存在此浏览器，7 天内可继续填写。' : '浏览器暂不支持保存草稿，请在本次填写完成。'}</p>
            {(birthDate || birthTime || birthLocation) && <button type="button" disabled={submitting} onClick={() => { draft.clearFields(); setError(null); setFieldErrors({}); startedFieldsRef.current.clear(); }}>清除已填内容</button>}
          </div>
          <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">

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
                  onClick={() => draft.update('gender', val)}
                  aria-pressed={gender === val}
                  className={`py-4 px-4 rounded-[var(--radius-md)] border text-sm font-medium transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 ${
                    gender === val
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/6 text-[var(--color-primary)]'
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
                    onChange={() => draft.update('calendarType', type)}
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
                onChange={(value) => {
                  draft.update('birthDate', value);
                  if (value) setFieldErrors((prev) => ({ ...prev, birthDate: undefined }));
                  trackFieldStart('birth_date');
                }}
                placeholder="选择日期"
                theme="panel"
                showPresets={false}
                helper=""
              />
              {fieldErrors.birthDate && (
                <p className="mt-1.5 text-xs text-[var(--color-primary)]" role="alert">
                  {fieldErrors.birthDate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                出生时辰 <span className="text-[var(--color-primary)]">*</span>
              </label>
              <IOSWheelTime
                value={birthTime}
                onChange={(value) => {
                  draft.update('birthTime', value);
                  if (value) setFieldErrors((prev) => ({ ...prev, birthTime: undefined }));
                  trackFieldStart('birth_time');
                }}
                placeholder="选择时间"
                theme="panel"
              />
              {fieldErrors.birthTime && (
                <p className="mt-1.5 text-xs text-[var(--color-primary)]" role="alert">
                  {fieldErrors.birthTime}
                </p>
              )}
            </div>
          </div>

          {/* Birth location */}
          <div>
            <label htmlFor="birth-location" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-3">
              出生地点 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-hint)]" />
              <input
                id="birth-location"
                type="text"
                value={birthLocation}
                onChange={(e) => {
                  draft.update('birthLocation', e.target.value);
                  if (e.target.value.trim()) setFieldErrors((prev) => ({ ...prev, birthLocation: undefined }));
                  trackFieldStart('birth_location');
                }}
                placeholder="搜索城市或坐标"
                aria-invalid={Boolean(fieldErrors.birthLocation)}
                aria-describedby={fieldErrors.birthLocation ? 'birth-location-error' : undefined}
                className={`w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/24 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] text-sm ${
                  fieldErrors.birthLocation ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
                }`}
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              出生地会用于历法和真太阳时换算，地点越明确，计算参考越稳定。
            </p>
            {fieldErrors.birthLocation && (
              <p id="birth-location-error" className="mt-1.5 text-xs text-[var(--color-primary)]" role="alert">
                {fieldErrors.birthLocation}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/30 p-3 text-sm text-[var(--color-primary)]" role="alert">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full min-h-[52px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-4 text-base font-semibold text-[var(--color-text-inverse)] transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
          >
            <span>{submitting ? '生成中...' : '生成命盘并查看报告'}</span>
            {!submitting && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            )}
          </button>

          <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
            专业术语会尽量翻译成白话，报告生成后可以继续进入对话追问。
          </p>
          </div>
        </form>
      </main>
    </div>
  );
}
