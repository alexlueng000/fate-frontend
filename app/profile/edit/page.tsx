'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, RefreshCw, ShieldAlert } from 'lucide-react';
import { PrettyDateField } from '@/app/components/Calender';
import { IOSWheelTime } from '@/app/components/TimePicker';
import { api } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';
import { clearAllChatData } from '@/app/lib/chat/storage';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import styles from './edit-profile.module.css';

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

type FieldName = 'birthDate' | 'birthTime' | 'birthLocation';

function ProfileSkeleton() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="正在加载个人档案">
      <div className={styles.skeletonLayout}>
        <div className={styles.skeletonIntro}>
          <span className={`${styles.skeleton} ${styles.skeletonBack}`} />
          <span className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <span className={`${styles.skeleton} ${styles.skeletonCopy}`} />
          <span className={`${styles.skeleton} ${styles.skeletonCopyShort}`} />
        </div>
        <div className={styles.skeletonForm}>
          <span className={`${styles.skeleton} ${styles.skeletonSection}`} />
          <span className={`${styles.skeleton} ${styles.skeletonField}`} />
          <span className={`${styles.skeleton} ${styles.skeletonField}`} />
          <span className={`${styles.skeleton} ${styles.skeletonField}`} />
          <span className={`${styles.skeleton} ${styles.skeletonButton}`} />
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">正在加载个人档案</span>
    </main>
  );
}

function EditProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/panel';
  const routeLoading = useRouteGuard(true, true);
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (showDeleteConfirm && !dialog.open) {
      dialog.showModal();
      cancelButtonRef.current?.focus();
    } else if (!showDeleteConfirm && dialog.open) {
      dialog.close();
    }
  }, [showDeleteConfirm]);

  useEffect(() => {
    if (routeLoading) return;
    const fetchProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) throw new Error('登录状态已失效，请重新登录后再试');
        const response = await fetch(api('/profile/me'), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('暂时无法读取个人档案，请稍后重试');
        const data = await response.json();
        setProfile(data);
        setGender(data.gender === 'male' ? '男' : '女');
        setCalendarType(data.calendar_type === 'solar' ? '公历' : '农历');
        setBirthDate(data.birth_date);
        setBirthTime(data.birth_time);
        setBirthLocation(data.birth_location);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '暂时无法读取个人档案，请稍后重试');
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [routeLoading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const nextErrors: Partial<Record<FieldName, string>> = {};
    if (!birthDate) nextErrors.birthDate = '请选择出生日期';
    if (!birthTime) nextErrors.birthTime = '请选择出生时间';
    if (!birthLocation.trim()) nextErrors.birthLocation = '请输入出生地点';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError('请先补全标记的出生信息');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('登录状态已失效，请重新登录后再试');
      const response = await fetch(api('/profile/update'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        let message = '保存失败，请检查网络后重试';
        try {
          const payload = JSON.parse(text);
          if (Array.isArray(payload.detail)) {
            message = payload.detail.map((item: unknown) => {
              if (typeof item === 'object' && item !== null && 'msg' in item) {
                const detail = (item as { msg?: unknown }).msg;
                if (typeof detail === 'string') return detail;
              }
              return JSON.stringify(item);
            }).join('；');
          } else if (typeof payload.detail === 'string') message = payload.detail;
          else if (typeof payload.message === 'string') message = payload.message;
        } catch {
          message = text || message;
        }
        throw new Error(message);
      }
      clearAllChatData();
      router.push('/report');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '保存失败，请检查网络后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('登录状态已失效，请重新登录后再试');
      const response = await fetch(api('/profile/delete'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('删除失败，请稍后重试');
      router.push('/profile/create');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '删除失败，请稍后重试');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const closeDialog = () => {
    if (deleting) return;
    setShowDeleteConfirm(false);
    requestAnimationFrame(() => deleteButtonRef.current?.focus());
  };

  if (routeLoading || fetching) return <ProfileSkeleton />;
  if (error && !profile) {
    return (
      <main className={styles.page}>
        <div className={styles.loadError}>
          <p className={styles.eyebrow}>Profile unavailable</p>
          <h1>暂时无法打开档案</h1>
          <p>{error}</p>
          <button type="button" onClick={() => router.push('/account')} className={styles.primaryButton}>返回账户中心</button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.intro}>
          <button type="button" onClick={() => router.push(returnTo)} className={styles.backButton}>
            <ArrowLeft aria-hidden />返回
          </button>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>Birth profile</p>
            <h1>修改个人档案</h1>
            <p className={styles.lead}>请仔细核对出生信息。保存后，系统会依据新资料重新计算命盘。</p>
          </div>
          <div className={styles.impactNote}>
            <RefreshCw aria-hidden />
            <p>原命盘报告会失效，下一步将自动生成一份与新资料对应的报告。</p>
          </div>
        </aside>

        <div className={styles.editor}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <section className={styles.formSection} aria-labelledby="basic-information-title">
              <SectionHeading index="01" title="基础信息" description="用于排定命盘的阴阳与历法依据" id="basic-information-title" />
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel} id="gender-label">性别</span>
                <div className={styles.segmentedControl} role="group" aria-labelledby="gender-label">
                  {(['男', '女'] as const).map((value) => (
                    <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)} className={`${styles.segmentButton} ${gender === value ? styles.segmentSelected : ''}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <fieldset className={styles.fieldGroup}>
                <legend className={styles.fieldLabel}>历法类型</legend>
                <div className={styles.radioGroup}>
                  {(['公历', '农历'] as const).map((value) => (
                    <label key={value} className={styles.radioLabel}>
                      <input type="radio" name="calendarType" value={value} checked={calendarType === value} onChange={() => setCalendarType(value)} />
                      <span className={styles.radioMark} aria-hidden /><span>{value}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section className={styles.formSection} aria-labelledby="birth-information-title">
              <SectionHeading index="02" title="出生信息" description="日期、时间和地点共同影响排盘结果" id="birth-information-title" />
              <div className={styles.dateTimeGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>出生日期</label>
                  <PrettyDateField value={birthDate} onChange={(value) => { setBirthDate(value); if (value) setFieldErrors((current) => ({ ...current, birthDate: undefined })); }} placeholder="选择日期" theme="panel" showPresets={false} helper="" />
                  {fieldErrors.birthDate && <p className={styles.fieldError} role="alert">{fieldErrors.birthDate}</p>}
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>出生时间</label>
                  <IOSWheelTime value={birthTime} onChange={(value) => { setBirthTime(value); if (value) setFieldErrors((current) => ({ ...current, birthTime: undefined })); }} placeholder="选择时间" theme="panel" />
                  {fieldErrors.birthTime && <p className={styles.fieldError} role="alert">{fieldErrors.birthTime}</p>}
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="birth-location" className={styles.fieldLabel}>出生地点</label>
                <div className={styles.locationField}>
                  <MapPin aria-hidden />
                  <input id="birth-location" type="text" value={birthLocation} onChange={(event) => { setBirthLocation(event.target.value); if (event.target.value.trim()) setFieldErrors((current) => ({ ...current, birthLocation: undefined })); }} placeholder="例如：北京市朝阳区" aria-invalid={Boolean(fieldErrors.birthLocation)} aria-describedby={fieldErrors.birthLocation ? 'birth-location-error' : 'birth-location-help'} />
                </div>
                <p id="birth-location-help" className={styles.fieldHelp}>地点越明确，真太阳时换算的参考越稳定。</p>
                {fieldErrors.birthLocation && <p id="birth-location-error" className={styles.fieldError} role="alert">{fieldErrors.birthLocation}</p>}
              </div>
            </section>

            {error && <div className={styles.formError} role="alert" aria-live="assertive"><ShieldAlert aria-hidden /><span>{error}</span></div>}
            <div className={styles.submitArea}>
              <button type="submit" disabled={submitting} className={styles.primaryButton}>{submitting ? '正在保存…' : '保存修改'}</button>
              <p>保存后将重新生成命盘与报告</p>
            </div>
          </form>

          <section className={styles.dangerZone} aria-labelledby="delete-profile-title">
            <div><h2 id="delete-profile-title">删除个人档案</h2><p>出生资料、命盘和已有报告将被永久删除，且无法恢复。</p></div>
            <button ref={deleteButtonRef} type="button" onClick={() => setShowDeleteConfirm(true)} className={styles.deleteButton}>删除档案</button>
          </section>
        </div>
      </div>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description" onCancel={(event) => { event.preventDefault(); closeDialog(); }} onClose={() => setShowDeleteConfirm(false)} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        <div className={styles.dialogPanel}>
          <p className={styles.eyebrow}>Permanent action</p>
          <h2 id="delete-dialog-title">确认删除个人档案？</h2>
          <p id="delete-dialog-description">出生资料、命盘与已有报告都会被永久删除。此操作无法撤销。</p>
          <div className={styles.dialogActions}>
            <button ref={cancelButtonRef} type="button" onClick={closeDialog} disabled={deleting} className={styles.secondaryButton}>保留档案</button>
            <button type="button" onClick={handleDelete} disabled={deleting} className={styles.confirmDeleteButton}>{deleting ? '正在删除…' : '永久删除档案'}</button>
          </div>
        </div>
      </dialog>
    </main>
  );
}

function SectionHeading({ index, title, description, id }: { index: string; title: string; description: string; id: string }) {
  return <div className={styles.sectionHeading}><p className={styles.sectionIndex}>{index}</p><div><h2 id={id}>{title}</h2><p>{description}</p></div></div>;
}

export default function EditProfilePage() {
  return <Suspense fallback={<ProfileSkeleton />}><EditProfileContent /></Suspense>;
}
