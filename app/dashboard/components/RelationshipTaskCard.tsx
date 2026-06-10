'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, PenLine } from 'lucide-react';

import {
  recordRelationshipTaskProgress,
  scheduleRelationshipTaskReview,
  type RelationshipTaskContext,
} from '@/app/lib/tasks/relationship';
import { relationshipProgressApi } from '@/app/lib/relationship-progress/api';
import { trackEvent } from '@/app/lib/analytics/track';

type RelationshipTaskCardProps = {
  task: RelationshipTaskContext | null;
  onTaskUpdate: (task: RelationshipTaskContext) => void;
};

function formatReviewDate(iso?: string) {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  } catch {
    return null;
  }
}

export function RelationshipTaskCard({ task, onTaskUpdate }: RelationshipTaskCardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [progress, setProgress] = useState('');
  const reviewDate = useMemo(() => formatReviewDate(task?.reviewDueAt), [task?.reviewDueAt]);

  if (!task) return null;

  const saveProgress = async () => {
    if (!progress.trim() || isSaving) return;
    const next = recordRelationshipTaskProgress(task, progress);
    setProgress('');
    setIsRecording(false);
    onTaskUpdate(next);
    trackEvent('relationship_progress_save', {
      payload: {
        mode: next.mode,
        has_review_due_at: Boolean(next.reviewDueAt),
      },
    });

    setIsSaving(true);
    try {
      const saved = await relationshipProgressApi.saveProgress(next, next.lastProgress ?? progress);
      onTaskUpdate(saved.task_context);
    } catch {
      onTaskUpdate(next);
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleReview = async () => {
    if (isScheduling) return;
    const next = scheduleRelationshipTaskReview(task, 3);
    onTaskUpdate(next);
    trackEvent('relationship_review_schedule', {
      payload: {
        mode: next.mode,
        days: 3,
      },
    });

    setIsScheduling(true);
    try {
      const saved = await relationshipProgressApi.scheduleReview(next);
      onTaskUpdate(saved.task_context);
    } catch {
      onTaskUpdate(next);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="border border-[var(--color-primary)]/25 bg-[var(--color-bg-elevated)] p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.04em] text-[var(--color-primary)]">
          正在处理的感情任务
        </p>
        <span className="text-xs text-[var(--color-text-muted)]">
          {task.mode === 'bazi' ? '八字长期模式' : '六爻具体关系'}
        </span>
      </div>
      <h3 className="text-sm font-medium leading-6 text-[var(--color-text-primary)]">
        {task.title}
      </h3>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
        {task.nextAction}
      </p>

      {(task.lastProgress || reviewDate) && (
        <div className="mt-3 grid gap-2 border-t border-[var(--color-border)] pt-3 text-xs leading-5 text-[var(--color-text-secondary)]">
          {task.lastProgress && (
            <p>
              <span className="font-medium text-[var(--color-text-primary)]">上次进展：</span>
              {task.lastProgress}
            </p>
          )}
          {reviewDate && (
            <p>
              <span className="font-medium text-[var(--color-text-primary)]">复盘提醒：</span>
              {reviewDate} 回来看观察结果。
            </p>
          )}
        </div>
      )}

      {isRecording && (
        <div className="mt-3 border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[var(--color-text-primary)]">
              今天有什么新进展？
            </span>
            <textarea
              value={progress}
              onChange={(event) => setProgress(event.target.value)}
              rows={3}
              placeholder="例如：对方主动联系了；或者我沟通后发现自己没有那么焦虑了。"
              className="w-full resize-none rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm leading-6 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-hint)] focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[rgba(181,68,52,0.12)]"
            />
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={saveProgress}
              disabled={!progress.trim() || isSaving}
              className="inline-flex min-h-10 items-center justify-center rounded-[3px] bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? '保存中' : '保存进展'}
            </button>
            <button
              type="button"
              onClick={() => {
                setProgress('');
                setIsRecording(false);
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-[3px] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)]"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={task.href}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
        >
          继续这个任务
          <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
        </Link>
        <button
          type="button"
          onClick={() => setIsRecording((current) => !current)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
        >
          <PenLine className="h-4 w-4" strokeWidth={1.6} />
          记录进展
        </button>
        <button
          type="button"
          onClick={scheduleReview}
          disabled={isScheduling}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
        >
          <CalendarClock className="h-4 w-4" strokeWidth={1.6} />
          {isScheduling ? '设置中' : '3天后复盘'}
        </button>
        <Link
          href="/relationship"
          className="inline-flex min-h-11 items-center justify-center rounded-[3px] px-4 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(181,68,52,0.12)]"
        >
          重新分诊
        </Link>
      </div>
    </div>
  );
}
