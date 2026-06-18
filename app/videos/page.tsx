'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, Clock, Lock, Play } from 'lucide-react';
import { VideoCourse, getVideoCourses } from '@/app/lib/api';

function formatDuration(seconds?: number | null) {
  if (!seconds) return '时长待补充';
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} 分钟`;
}

export default function VideosPage() {
  const [courses, setCourses] = useState<VideoCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVideoCourses()
      .then(setCourses)
      .catch((e) => setError((e as Error).message || '加载失败'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-[var(--color-border)] pb-6">
          <p className="mb-3 text-[13px] font-medium tracking-[0.16em] text-[var(--color-text-muted)]">
            VIDEO STUDY
          </p>
          <h1 className="font-serif text-[1.75rem] font-medium leading-tight text-[var(--color-text-primary)]">
            视频学习
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-7 text-[var(--color-text-secondary)]">
            会员可观看完整课程。这里先作为课程入口，后续可以接入腾讯云 VOD 的临时播放地址。
          </p>
        </header>

        {error && (
          <p className="mb-5 border border-[rgba(181,68,52,0.24)] bg-[var(--color-bg-card)] px-4 py-3 text-[14px] text-[var(--color-primary)]">
            {error}
          </p>
        )}

        {loading && (
          <div className="grid gap-4">
            <div className="h-36 animate-pulse bg-[var(--color-bg-card)]" />
            <div className="h-36 animate-pulse bg-[var(--color-bg-card)]" />
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
            <BookOpen className="mx-auto mb-4 text-[var(--color-text-muted)]" size={28} />
            <h2 className="font-serif text-xl text-[var(--color-text-primary)]">还没有课程</h2>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">添加课程和课时后，这里会显示学习入口。</p>
          </div>
        )}

        <div className="space-y-5">
          {courses.map((course) => (
            <section key={course.id} className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)]">{course.title}</h2>
                  {course.subtitle && (
                    <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">{course.subtitle}</p>
                  )}
                </div>
                <p className="text-[13px] text-[var(--color-text-muted)]">{course.lessons.length} 节课</p>
              </div>

              <div className="divide-y divide-[var(--color-border)]">
                {course.lessons
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/videos/lesson/${lesson.id}`}
                      className="flex min-h-[64px] items-center gap-4 py-4 text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                        <Play size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[16px]">{lesson.title}</span>
                        <span className="mt-1 flex items-center gap-3 text-[13px] text-[var(--color-text-muted)]">
                          <span className="inline-flex items-center gap-1"><Clock size={13} />{formatDuration(lesson.duration_seconds)}</span>
                          {lesson.access_level === 'member' && <span className="inline-flex items-center gap-1"><Lock size={13} />会员</span>}
                        </span>
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
