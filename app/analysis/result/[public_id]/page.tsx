'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, RefreshCw, Save } from 'lucide-react';

import { bindGuestAnalysis, getGuestAnalysis, type GuestAnalysis } from '@/app/lib/api';
import { trackEvent } from '@/app/lib/analytics/track';
import { useUser } from '@/app/lib/auth';
import { savePaipanLocal } from '@/app/lib/chat/storage';
import type { Paipan } from '@/app/lib/chat/types';

type AnalysisResult = {
  overview?: unknown;
  personality?: unknown;
  career?: unknown;
  relationship?: unknown;
  wealth?: unknown;
  current_phase?: unknown;
  suggestions?: unknown;
};

function text(value: unknown, fallback = '暂未生成'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function suggestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function getFourPillars(analysis: GuestAnalysis): Record<string, string[]> | null {
  const result = analysis.bazi_result as { mingpan?: { four_pillars?: Record<string, string[]> } } | null | undefined;
  return result?.mingpan?.four_pillars ?? null;
}

function getMingpan(analysis: GuestAnalysis): Paipan | null {
  const result = analysis.bazi_result as { mingpan?: unknown } | null | undefined;
  const mingpan = result?.mingpan;
  if (!mingpan || typeof mingpan !== 'object') return null;
  const candidate = mingpan as Paipan;
  if (!candidate.four_pillars || !Array.isArray(candidate.dayun)) return null;
  return candidate;
}

export default function GuestAnalysisResultPage() {
  const params = useParams<{ public_id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const publicId = params.public_id;
  const [analysis, setAnalysis] = useState<GuestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binding, setBinding] = useState(false);
  const [bound, setBound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getGuestAnalysis(publicId);
        if (!cancelled) {
          setAnalysis(result);
          setBound(Boolean(result.user_id || result.bound_at));
          trackEvent('guest_analysis_result_view', {
            payload: { public_id: result.public_id, status: result.status },
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '读取结果失败';
          setError(message);
          trackEvent('guest_analysis_result_error', {
            payload: { public_id: publicId, error: message.slice(0, 120) },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (publicId) void load();
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  const result = (analysis?.analysis_result ?? {}) as AnalysisResult;
  const fourPillars = analysis ? getFourPillars(analysis) : null;
  const suggestionItems = useMemo(() => suggestions(result.suggestions), [result.suggestions]);
  const loginHref = `/login?redirect=${encodeURIComponent(`/analysis/result/${publicId}`)}`;
  const hasStructuredResult = analysis?.analysis_result && Object.keys(analysis.analysis_result).length > 0;

  const bindAndContinue = useCallback(async () => {
    if (!analysis) return;
    setActionError(null);
    trackEvent('guest_analysis_continue_click', {
      payload: { public_id: analysis.public_id, logged_in: Boolean(user) },
    });

    if (!user) {
      router.push(loginHref);
      return;
    }

    setBinding(true);
    try {
      await bindGuestAnalysis(analysis.public_id);
      setBound(true);
      trackEvent('guest_analysis_bind_success', {
        payload: { public_id: analysis.public_id },
      });
      const mingpan = getMingpan(analysis);
      if (mingpan) savePaipanLocal(mingpan);
      router.push(`/chat?guest_analysis_public_id=${encodeURIComponent(analysis.public_id)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败，请稍后重试';
      setActionError(message);
      trackEvent('guest_analysis_bind_failed', {
        payload: { public_id: analysis.public_id, error: message.slice(0, 120) },
      });
    } finally {
      setBinding(false);
    }
  }, [analysis, loginHref, router, user]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          正在读取首次分析
        </div>
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] px-4 py-10">
        <div className="mx-auto max-w-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-md)]">
          <h1 className="text-xl font-medium text-[var(--color-text-primary)]">结果暂时不可用</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{error || '请稍后重试'}</p>
          <Link href="/analysis/start" className="btn btn-primary mt-6">
            重新填写
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <div className="mx-auto max-w-5xl">
        <section className="border-b border-[var(--color-border)] pb-7">
          <p className="text-sm text-[var(--color-text-muted)]">首次结果</p>
          <h1
            className="mt-3 max-w-3xl text-3xl font-medium leading-tight text-[var(--color-text-primary)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {text(result.overview, '你的首次个人分析已生成')}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2">
              {analysis.gender === 'male' ? '男' : '女'}
            </span>
            <span className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2">
              {analysis.calendar_type === 'lunar' ? '农历' : '公历'} {analysis.birth_date} {analysis.birth_time.slice(0, 5)}
            </span>
            <span className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2">
              {analysis.birth_location}
            </span>
          </div>
          <div className="mt-6 border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <p className="text-sm leading-6 text-[var(--color-text-body)]">
              首轮解读可以完整查看。想把它保存下来，或围绕事业、感情、财富继续追问时，再登录即可。
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={bindAndContinue}
                disabled={binding}
                className="btn btn-primary"
              >
                {binding ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                保存并继续追问
              </button>
              {!user && (
                <Link href={loginHref} className="btn btn-secondary">
                  登录后保存这份分析
                </Link>
              )}
            </div>
            {bound && (
              <p className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                已保存到你的账户
              </p>
            )}
            {actionError && (
              <p className="mt-3 text-sm text-[var(--color-primary)]" role="alert">
                {actionError}
              </p>
            )}
          </div>
        </section>

        {fourPillars && (
          <section className="grid grid-cols-4 border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-md)]">
            {[
              ['年柱', fourPillars.year],
              ['月柱', fourPillars.month],
              ['日柱', fourPillars.day],
              ['时柱', fourPillars.hour],
            ].map(([label, pillar], index) => (
              <div
                key={label as string}
                className={`px-2 py-5 text-center ${index > 0 ? 'border-l border-[var(--color-border)]' : ''}`}
              >
                <p className="text-xs text-[var(--color-text-muted)]">{label as string}</p>
                <p
                  className="mt-2 text-2xl font-medium text-[var(--color-text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {(pillar as string[] | undefined)?.join('') || '-'}
                </p>
              </div>
            ))}
          </section>
        )}

        {hasStructuredResult ? (
          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            {[
              ['性格底色', result.personality],
              ['事业方向', result.career],
              ['感情关系', result.relationship],
              ['财富节奏', result.wealth],
            ].map(([title, content]) => (
              <article key={title as string} className="border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-md)]">
                <h2 className="text-base font-medium text-[var(--color-text-primary)]">{title as string}</h2>
                <p className="mt-3 text-base leading-8 text-[var(--color-text-body)]">{text(content)}</p>
              </article>
            ))}
          </section>
        ) : analysis.analysis_markdown ? (
          <section className="mt-8 border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-md)]">
            <h2 className="text-base font-medium text-[var(--color-text-primary)]">首次分析</h2>
            <div className="mt-3 whitespace-pre-wrap text-base leading-8 text-[var(--color-text-body)]">
              {analysis.analysis_markdown}
            </div>
          </section>
        ) : null}

        {hasStructuredResult && (
          <section className="mt-6 border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-md)]">
            <h2 className="text-base font-medium text-[var(--color-text-primary)]">当前阶段提醒</h2>
            <p className="mt-3 text-base leading-8 text-[var(--color-text-body)]">{text(result.current_phase)}</p>
            {suggestionItems.length > 0 && (
              <ul className="mt-5 space-y-3">
                {suggestionItems.map((item) => (
                  <li key={item} className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="mt-6 border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-5">
          <h2 className="text-base font-medium text-[var(--color-text-primary)]">下一步</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-body)]">
            这份首轮解读已经完整生成。登录后可以保存结果，并围绕同一张命盘继续追问，不需要重新填写出生信息。
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={bindAndContinue}
              disabled={binding}
              className="btn btn-primary"
            >
              {binding ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
              保存并继续追问
            </button>
            <Link href="/analysis/start" className="btn btn-secondary">
              <RefreshCw className="h-4 w-4" aria-hidden />
              重新分析
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
