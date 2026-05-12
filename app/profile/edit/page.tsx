'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { PrettyDateField } from '@/app/components/Calender';
import { IOSWheelTime } from '@/app/components/TimePicker';
import { clearAllChatData } from '@/app/lib/chat/storage';

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

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/panel';
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

  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // 焦点管理和键盘支持
  useEffect(() => {
    if (showDeleteConfirm) {
      // 聚焦到取消按钮
      cancelButtonRef.current?.focus();

      // 监听 Escape 键
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowDeleteConfirm(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDeleteConfirm]);

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
        // 将后端返回的英文值转换为中文显示
        setGender(data.gender === 'male' ? '男' : '女');
        setCalendarType(data.calendar_type === 'solar' ? '公历' : '农历');
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
          gender: gender === '男' ? 'male' : 'female',
          calendar_type: calendarType === '公历' ? 'solar' : 'lunar',
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
        } catch {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // 档案关键字段已变更：后端会重算命盘并作废旧的 ai_report，
      // 这里清掉前端聊天缓存（避免续接到基于旧八字的对话），
      // 然后跳到 /report 自动触发新报告流式生成。
      clearAllChatData();
      router.push('/report');
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
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]" role="status" aria-live="polite">加载中...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-[var(--color-primary)] mb-4">{error}</div>
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-3 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-body)] p-6 sm:p-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(returnTo)}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 flex items-center gap-2 p-2 min-h-[44px] min-w-[44px] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
            aria-label="返回"
          >
            <span>←</span> 返回
          </button>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-serif" style={{ fontFamily: 'var(--font-display)' }}>修改个人档案</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">修改关键信息后，系统将自动重新计算命盘</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6 sm:p-8 space-y-6 shadow-[var(--shadow-md)]">
          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              性别 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <div className="flex gap-3" role="group" aria-label="性别选择">
              <button
                type="button"
                onClick={() => setGender('男')}
                aria-pressed={gender === '男'}
                className={`flex-1 py-4 px-4 rounded-md border-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 ${
                  gender === '男'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                男
              </button>
              <button
                type="button"
                onClick={() => setGender('女')}
                aria-pressed={gender === '女'}
                className={`flex-1 py-4 px-4 rounded-md border-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 ${
                  gender === '女'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                女
              </button>
            </div>
          </div>

          {/* 历法类型 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              历法类型 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <div className="flex gap-3" role="group" aria-label="历法类型选择">
              <button
                type="button"
                onClick={() => setCalendarType('公历')}
                aria-pressed={calendarType === '公历'}
                className={`flex-1 py-4 px-4 rounded-md border-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 ${
                  calendarType === '公历'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                公历
              </button>
              <button
                type="button"
                onClick={() => setCalendarType('农历')}
                aria-pressed={calendarType === '农历'}
                className={`flex-1 py-4 px-4 rounded-md border-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 ${
                  calendarType === '农历'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                农历
              </button>
            </div>
          </div>

          {/* 出生日期 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
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

          {/* 出生时间 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              出生时间 <span className="text-[var(--color-primary)]">*</span>
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
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              出生地点 <span className="text-[var(--color-primary)]">*</span>
            </label>
            <input
              type="text"
              value={birthLocation}
              onChange={(e) => setBirthLocation(e.target.value)}
              placeholder="例如：北京市"
              className="w-full px-4 py-3 rounded-md border-2 border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/24 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-[var(--color-text-hint)]"
            />
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              请输入出生城市，用于计算真太阳时
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 p-4 text-sm text-[var(--color-primary)]" role="alert">
              {error}
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 px-6 rounded-md bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-inverse)] font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 min-h-[44px]"
            >
              {submitting ? '保存中...' : '保存修改'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-4 rounded-md border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 min-h-[44px]"
            >
              删除档案
            </button>
          </div>
        </form>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-[rgba(42,37,34,0.5)] flex items-center justify-center p-6 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteConfirm(false);
          }}
        >
          <div
            className="bg-[var(--color-bg-card)] rounded-lg p-8 max-w-md w-full shadow-[var(--shadow-lg)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-dialog-title" className="text-xl font-bold text-[var(--color-text-primary)] mb-4 font-serif">确认删除档案？</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              删除后，您的个人档案和命盘信息将被永久删除，无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                ref={cancelButtonRef}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 px-6 rounded-md border-2 border-[var(--color-border)] text-[var(--color-text-body)] hover:bg-[var(--color-bg-hover)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 min-h-[44px]"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 px-6 rounded-md bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-inverse)] font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-sm)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 min-h-[44px]"
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

export default function EditProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]" role="status" aria-live="polite">加载中...</div>
      </div>
    }>
      <EditProfileContent />
    </Suspense>
  );
}
