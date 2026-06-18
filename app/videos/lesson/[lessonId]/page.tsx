'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lock, PlayCircle } from 'lucide-react';
import { VideoLesson, VideoPlay, getVideoLesson, getVideoPlay, updateVideoProgress } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';

export default function VideoLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = Number(params.lessonId);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [play, setPlay] = useState<VideoPlay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setLocked(false);
      try {
        const lessonData = await getVideoLesson(lessonId);
        setLesson(lessonData);
        const playData = await getVideoPlay(lessonId);
        setPlay(playData);
      } catch (e) {
        const message = (e as Error).message || '加载失败';
        if (message.includes('MEMBERSHIP_REQUIRED') || message.includes('403')) {
          setLocked(true);
        } else if (message.includes('UNAUTHENTICATED') || message.includes('401')) {
          setError('请先登录，再继续观看。');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }
    if (Number.isFinite(lessonId)) void load();
  }, [lessonId]);

  async function saveProgress(completed = false) {
    const video = videoRef.current;
    if (!video || !getAuthToken()) return;
    await updateVideoProgress(lessonId, {
      position_seconds: Math.floor(video.currentTime),
      completed,
    }).catch(() => {});
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/videos"
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
        >
          <ArrowLeft size={17} />
          返回课程
        </Link>

        <header className="mb-6 border-b border-[var(--color-border)] pb-5">
          <p className="mb-2 text-[13px] font-medium tracking-[0.16em] text-[var(--color-text-muted)]">
            LESSON
          </p>
          <h1 className="font-serif text-[1.5rem] font-medium leading-tight text-[var(--color-text-primary)]">
            {lesson?.title || '视频课程'}
          </h1>
          {lesson?.description && (
            <p className="mt-3 max-w-[65ch] text-[15px] leading-7 text-[var(--color-text-secondary)]">
              {lesson.description}
            </p>
          )}
        </header>

        <section className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 sm:p-4">
          {loading && <div className="aspect-video animate-pulse bg-[var(--color-bg-alt)]" />}

          {!loading && play && (
            <video
              ref={videoRef}
              className="aspect-video w-full bg-[var(--color-text-primary)]"
              controls
              src={play.play_url}
              onPause={() => void saveProgress(false)}
              onEnded={() => void saveProgress(true)}
            />
          )}

          {!loading && locked && (
            <div className="flex aspect-video flex-col items-center justify-center bg-[var(--color-bg-alt)] px-5 text-center">
              <Lock className="mb-4 text-[var(--color-primary)]" size={30} />
              <h2 className="font-serif text-xl text-[var(--color-text-primary)]">会员课程</h2>
              <p className="mt-3 max-w-[48ch] text-[14px] leading-6 text-[var(--color-text-secondary)]">
                开通 39 元会员月卡后，可以观看会员视频，并获得八字和六爻额度。
              </p>
              <button
                type="button"
                onClick={() => router.push('/membership')}
                className="mt-5 inline-flex min-h-11 items-center justify-center bg-[var(--color-primary)] px-5 text-[14px] font-medium text-[var(--color-text-inverse)]"
                style={{ borderRadius: 'var(--radius-md)' }}
              >
                开通会员
              </button>
            </div>
          )}

          {!loading && error && !locked && (
            <div className="flex aspect-video flex-col items-center justify-center bg-[var(--color-bg-alt)] px-5 text-center">
              <PlayCircle className="mb-4 text-[var(--color-text-muted)]" size={30} />
              <p className="max-w-[48ch] text-[14px] leading-6 text-[var(--color-text-secondary)]">{error}</p>
              {error.includes('登录') && (
                <button
                  type="button"
                  onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/videos/lesson/${lessonId}`)}`)}
                  className="mt-5 inline-flex min-h-11 items-center justify-center bg-[var(--color-primary)] px-5 text-[14px] font-medium text-[var(--color-text-inverse)]"
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  登录
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
