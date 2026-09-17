'use client';

import TimeCorrectionNotice from '@/app/components/chat/TimeCorrectionNotice';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { getAuthToken } from '@/app/lib/auth';
import { api } from '@/app/lib/api';
import { trackEvent } from '@/app/lib/analytics/track';
import ReportReader from '@/app/components/report/ReportReader';
import SectionQuestion from '@/app/components/report/SectionQuestion';
import type { ReportSection } from '@/app/lib/report/sections';
import { LOCAL_PREVIEW } from '@/app/lib/local-preview/config';
import { getWuxing, wuxingColor, type Wuxing } from '@/app/components/WuXing';
import { Paipan } from '@/app/lib/chat/types';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { trySSE } from '@/app/lib/chat/sse';
import { savePaipanLocal, saveConversation, clearActiveConversationId } from '@/app/lib/chat/storage';
import { DetailedPaipanTable } from '@/app/components/chat/DetailedPaipanTable';

interface ProfileBrief {
  id: number;
  gender: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  display_info: string;
}

function PillarChar({ char }: { char: string }) {
  const el = getWuxing(char);
  return (
    <div className="flex flex-col items-center gap-1 leading-none">
      <span
        className="font-serif text-[28px] sm:text-3xl"
        style={{ color: wuxingColor(el) }}
      >
        {char || '—'}
      </span>
      {el && (
        <span className="text-[11px] text-[var(--color-text-muted)]">{el}</span>
      )}
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const loading = useRouteGuard(true, true);

  const [profile, setProfile] = useState<ProfileBrief | null>(null);
  const [paipan, setPaipan] = useState<Paipan | null>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reportViewTrackedRef = useRef(false);
  const summaryTrackedRef = useRef(false);

  useEffect(() => {
    if (!loading && !reportViewTrackedRef.current) {
      reportViewTrackedRef.current = true;
      trackEvent('report_view', {
        payload: { has_ai_report: Boolean(aiReport) },
      });
    }
  }, [loading, aiReport]);

  useEffect(() => {
    if (!aiReport || summaryTrackedRef.current) return;
    summaryTrackedRef.current = true;
    trackEvent('report_summary_view', {
      payload: { report_length: aiReport.length },
    });
  }, [aiReport]);

  useEffect(() => {
    if (streaming && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [aiReport, streaming]);

  useEffect(() => {
    if (loading) return;

    const fetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('未登录');
          return;
        }

        const profileResp = await fetch(api('/profile/me'), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });

        if (!profileResp.ok) {
          throw new Error('获取档案失败');
        }

        const profileData = await profileResp.json();
        setProfile(profileData);

        const paipanResp = await fetch(api('/bazi/calc_paipan'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            gender: profileData.gender === 'male' ? '男' : '女',
            calendar: profileData.calendar_type === 'solar' ? 'gregorian' : 'lunar',
            birth_date: profileData.birth_date,
            birth_time: profileData.birth_time.substring(0, 5),
            birthplace: profileData.birth_location,
          }),
        });

        if (!paipanResp.ok) {
          throw new Error('计算命盘失败');
        }

        const paipanData = await paipanResp.json();
        const mingpan = paipanData.mingpan || paipanData;
        setPaipan(mingpan);
        savePaipanLocal(mingpan);

        if (profileData.ai_report) {
          setAiReport(profileData.ai_report);
          const cacheKey = `report_cache_${profileData.id}`;
          const cached = (() => {
            try { return JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch { return null; }
          })();
          if (LOCAL_PREVIEW) setConversationId('local-preview-chat');
          if (cached?.conversation_id && cached.report_content === profileData.ai_report) {
            setConversationId(cached.conversation_id);
            saveConversation(cached.conversation_id, [{ role: 'assistant', content: profileData.ai_report }]);
          }
          return;
        }

        setStreaming(true);
        let convId = '';
        let finalText = '';

        const saveReportToDb = (text: string) => {
          if (!text) return;
          fetch(api('/profile/report'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            credentials: 'include',
            body: JSON.stringify({ ai_report: text }),
          }).catch(() => {});
        };

        try {
          await trySSE(
            api('/chat/start'),
            { paipan: mingpan },
            (text) => {
              finalText = text;
              setAiReport(text);
            },
            (meta) => {
              const metaObj = meta as Record<string, unknown>;
              const cid = metaObj?.conversation_id || (metaObj?.meta as Record<string, unknown>)?.conversation_id || '';
              if (cid && typeof cid === 'string') {
                convId = cid;
                setConversationId(cid);
              }
            }
          );

          setStreaming(false);

          if (convId && finalText) {
            saveConversation(convId, [{ role: 'assistant', content: finalText }]);
            try {
              const cacheKey = `report_cache_${profileData.id}`;
              localStorage.setItem(cacheKey, JSON.stringify({ conversation_id: convId, report_content: finalText }));
            } catch {}
            saveReportToDb(finalText);
          }
        } catch (sseError) {
          console.warn('SSE failed, trying fallback:', sseError);
          setStreaming(false);
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const fallbackResp = await fetch(api('/chat/start'), {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ paipan: mingpan }),
          });

          if (fallbackResp.ok) {
            const fallbackData = await fallbackResp.json();
            finalText = fallbackData.reply || '';
            setAiReport(finalText);
            if (fallbackData.conversation_id) {
              convId = fallbackData.conversation_id;
              setConversationId(convId);
              try {
                const cacheKey = `report_cache_${profileData.id}`;
                localStorage.setItem(cacheKey, JSON.stringify({ conversation_id: convId, report_content: finalText }));
              } catch {}
              saveReportToDb(finalText);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
        setStreaming(false);
      }
    };

    fetchData();
  }, [loading]);

  const handleStartChat = (question?: string, source: 'primary' | 'question' = 'primary') => {
    trackEvent('report_chat_cta_click', {
      payload: { has_ai_report: Boolean(aiReport), streaming, source },
    });
    clearActiveConversationId();
    const query = question ? `?q=${encodeURIComponent(question)}` : '';
    router.push(`/panel${query}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-text-muted)] tracking-widest text-sm">加载中…</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-[var(--color-primary)] mb-4">{error}</div>
          <button onClick={() => router.push('/profile/create')} className="btn btn-primary">
            返回建档
          </button>
        </div>
      </div>
    );
  }

  const pillars = paipan
    ? [
        { label: '年柱', pillar: paipan.four_pillars.year, sublabel: '祖上·家庭' },
        { label: '月柱', pillar: paipan.four_pillars.month, sublabel: '父母·早年' },
        { label: '日柱', pillar: paipan.four_pillars.day, sublabel: '本人·婚姻', highlight: true },
        { label: '时柱', pillar: paipan.four_pillars.hour, sublabel: '子女·晚年' },
      ]
    : [];
  const parsedReport = parseSuggestedQuestions(aiReport);
  const questions = parsedReport.questions.slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]" ref={scrollRef}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-10 sm:mb-14">
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--color-text-primary)] mb-3 tracking-wide">
            命理分析报告
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {profile?.display_info || '您的八字命盘详细解读'}
          </p>
        </header>

        {paipan && (
          <section aria-label="四柱摘要" className="mb-6">
            <div className="mb-3 flex items-center justify-between text-xs">
              <h2 className="font-medium tracking-widest text-[var(--color-text-secondary)]">四柱命盘</h2>
              <span className="text-[var(--color-text-muted)]">天干 · 地支 · 五行</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {pillars.map(({ label, pillar, highlight }) => {
                const accent = wuxingColor(getWuxing(pillar?.[0] || ''));
                return (
                  <div
                    key={label}
                    className="relative overflow-hidden rounded-xl border px-1 py-4 text-center sm:px-3 sm:py-5"
                    style={{
                      background: `linear-gradient(155deg, color-mix(in srgb, ${accent} 12%, var(--color-bg-card)), var(--color-bg-card))`,
                      borderColor: highlight ? 'var(--color-primary)' : `color-mix(in srgb, ${accent} 25%, var(--color-border))`,
                      boxShadow: highlight ? '0 4px 18px var(--color-primary-glow)' : undefined,
                    }}
                  >
                    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5" style={{ background: highlight ? 'var(--color-primary)' : accent }} />
                    <p className={`mb-4 text-xs font-medium tracking-widest ${highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{label}</p>
                    <div className="flex justify-center gap-2 sm:gap-4">
                      {[0, 1].map(index => {
                        const char = pillar?.[index] || '';
                        const element = getWuxing(char);
                        return (
                          <div key={index} className="flex flex-col items-center gap-2">
                            <span className="font-serif text-[28px] leading-none sm:text-4xl" style={{ color: wuxingColor(element) }}>{char || '—'}</span>
                            <span className="rounded-full px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px]" style={{ color: wuxingColor(element), background: `color-mix(in srgb, ${wuxingColor(element)} 9%, transparent)` }}>{element || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className={`mt-3 text-[10px] sm:text-xs ${highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>{highlight ? '日干为日主' : '天干 / 地支'}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <TimeCorrectionNotice info={paipan} />

        {/* 命理解读 */}
        <section className="mb-12" aria-labelledby="reading-heading">
          <h2
            id="reading-heading"
            className="font-serif text-base font-semibold text-[var(--color-text-primary)] mb-5 tracking-wide"
          >
            命理解读
          </h2>
          {streaming && !aiReport && (
            <div role="status" aria-live="polite" className="py-12 text-center">
              <div
                aria-hidden="true"
                className="inline-block w-7 h-7 border-[3px] border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3"
              />
              <p className="text-sm text-[var(--color-text-secondary)]">
                AI 正在分析您的命盘…
              </p>
            </div>
          )}
          {aiReport && <ReportReader content={aiReport} streaming={streaming} onAsk={section => {
            setSelectedSection(section);
            requestAnimationFrame(() => questionRef.current?.scrollIntoView({ block: 'center' }));
          }} />}
          <div ref={questionRef}>
            {selectedSection && <SectionQuestion key={selectedSection.id} section={selectedSection} conversationId={conversationId} onClose={() => setSelectedSection(null)} />}
          </div>
          {streaming && aiReport && (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)] flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"
              />
              正在生成中…
            </div>
          )}
          {error && !aiReport && (
            <div className="py-12 text-center text-[var(--color-primary)]">
              {error}
            </div>
          )}
        </section>

        {/* CTA */}
        <div className="mb-12 border-t border-b border-[var(--color-border)] py-7">
          <h2 className="font-serif text-base font-semibold text-[var(--color-text-primary)] tracking-wide">
            继续讨论报告
          </h2>
          <div className="mt-5 space-y-3">
            {questions.map((question, index) => (
              <button
                key={question}
                type="button"
                onClick={() => handleStartChat(question, 'question')}
                disabled={streaming}
                className="group flex w-full min-h-12 items-start gap-3 border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-left transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
              >
                <span className="font-mono text-xs leading-6 text-[var(--color-primary)] tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm leading-6 text-[var(--color-text-body)]">
                  {question}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-6 text-center">
          <button
            onClick={() => handleStartChat()}
            disabled={streaming}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? '分析中…' : '自己写问题'}
          </button>
          <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[var(--color-text-muted)]">
            你可以补充现实处境，让 AI 把报告里的判断转成更具体的行动建议。
          </p>
          </div>
        </div>

        {/* 专业依据 */}
        {paipan && (
          <section className="pb-10" aria-labelledby="professional-info-heading">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Basis
            </p>
            <h2
              id="professional-info-heading"
              className="mb-5 font-serif text-base font-semibold tracking-wide text-[var(--color-text-primary)]"
            >
              专业命盘依据
            </h2>

            <div className="space-y-3">
              <details className="group border border-[var(--color-border)] bg-[var(--color-bg-card)]">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24">
                  <div>
                    <span className="font-serif text-[15px] font-medium text-[var(--color-text-primary)]">
                      查看四柱与详细排盘
                    </span>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                      展开后查看 AI 解读所参考的基础命盘信息。
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-[var(--color-primary)] group-open:hidden">
                    展开
                  </span>
                  <span className="hidden shrink-0 font-mono text-xs text-[var(--color-text-muted)] group-open:inline">
                    收起
                  </span>
                </summary>

                <div className="border-t border-[var(--color-border)] px-4 py-6 sm:px-5">
                  <section className="mb-8" aria-labelledby="four-pillars-heading">
                    <h3
                      id="four-pillars-heading"
                      className="mb-5 font-serif text-sm font-semibold tracking-wide text-[var(--color-text-primary)]"
                    >
                      四柱命盘
                    </h3>
                    <div className="grid grid-cols-4 gap-1 sm:gap-3">
                      {pillars.map(({ label, pillar, sublabel, highlight }) => (
                        <div
                          key={label}
                          className="relative flex flex-col items-center text-center pt-3 pb-2"
                        >
                          {highlight && (
                            <div
                              aria-hidden="true"
                              className="absolute top-0 inset-x-2 h-px bg-[var(--color-primary)]"
                            />
                          )}
                          <div
                            className={`text-xs font-medium mb-4 ${
                              highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                            }`}
                          >
                            {label}
                          </div>
                          <div className="flex flex-col items-center gap-3">
                            <PillarChar char={pillar?.[0] || ''} />
                            <PillarChar char={pillar?.[1] || ''} />
                          </div>
                          <div className="text-[11px] text-[var(--color-text-hint)] mt-3">
                            {sublabel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <DetailedPaipanTable paipan={paipan} />
                </div>
              </details>

              {paipan.dayun && paipan.dayun.length > 0 && (
                <details className="group border border-[var(--color-border)] bg-[var(--color-bg-card)]">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24">
                    <div>
                      <span className="font-serif text-[15px] font-medium text-[var(--color-text-primary)]">
                        查看长期节律参考
                      </span>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                        共 {paipan.dayun.length} 步大运，适合需要进一步核对时查看。
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-[var(--color-primary)] group-open:hidden">
                      展开
                    </span>
                    <span className="hidden shrink-0 font-mono text-xs text-[var(--color-text-muted)] group-open:inline">
                      收起
                    </span>
                  </summary>

                  <ol className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border-subtle)] px-4 py-3 sm:px-5">
                    {paipan.dayun.map((d, i) => {
                      const pillar = d.pillar?.join('') || '';
                      const gan = pillar[0] || '';
                      const zhi = pillar[1] || '';
                      const ganEl: Wuxing | null = getWuxing(gan);
                      const zhiEl: Wuxing | null = getWuxing(zhi);
                      return (
                        <li
                          key={i}
                          className="flex items-baseline gap-3 py-3 px-1"
                        >
                          <div className="w-[88px] shrink-0">
                            <div className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                              {d.start_year}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-muted)] tabular-nums leading-tight mt-0.5">
                              {d.age} 岁起
                            </div>
                          </div>
                          <div className="flex-1 flex items-baseline gap-1 font-serif">
                            <span
                              className="text-2xl"
                              style={{ color: wuxingColor(ganEl) }}
                            >
                              {gan || '—'}
                            </span>
                            <span
                              className="text-2xl"
                              style={{ color: wuxingColor(zhiEl) }}
                            >
                              {zhi || '—'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] shrink-0 tabular-nums">
                            {ganEl && zhiEl ? `${ganEl}·${zhiEl}` : ''}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </details>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
