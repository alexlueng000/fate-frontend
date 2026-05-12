'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { getAuthToken } from '@/app/lib/auth';
import { api } from '@/app/lib/api';
import Markdown from '@/app/components/Markdown';
import { getWuxing, wuxingColor, type Wuxing } from '@/app/components/WuXing';
import { Paipan } from '@/app/lib/chat/types';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          if (cached?.conversation_id) {
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
              localStorage.setItem(cacheKey, JSON.stringify({ conversation_id: convId }));
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
                localStorage.setItem(cacheKey, JSON.stringify({ conversation_id: convId }));
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

  const handleStartChat = () => {
    clearActiveConversationId();
    router.push('/panel');
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

        {/* 四柱命盘 — flat grid, no nested cards, tokenized colors */}
        {paipan && (
          <section className="mb-12" aria-labelledby="four-pillars-heading">
            <h2
              id="four-pillars-heading"
              className="font-serif text-base font-semibold text-[var(--color-text-primary)] mb-5 tracking-wide"
            >
              四柱命盘
            </h2>
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
        )}

        {/* 详细排盘 */}
        {paipan && (
          <section className="mb-12" aria-label="详细排盘">
            <DetailedPaipanTable paipan={paipan} />
          </section>
        )}

        {/* 十年大运 — compact rows, was oversized card grid */}
        {paipan && paipan.dayun && paipan.dayun.length > 0 && (
          <section className="mb-14" aria-labelledby="dayun-heading">
            <div className="flex items-baseline justify-between mb-5">
              <h2
                id="dayun-heading"
                className="font-serif text-base font-semibold text-[var(--color-text-primary)] tracking-wide"
              >
                十年大运
              </h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                共 {paipan.dayun.length} 步
              </span>
            </div>
            <ol className="border-t border-b border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
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
          </section>
        )}

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
          {aiReport && (
            <div className="msg-md">
              <Markdown content={aiReport} />
            </div>
          )}
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
        <div className="text-center pb-10">
          <button
            onClick={handleStartChat}
            disabled={streaming}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? '分析中…' : '开始对话'}
          </button>
          <p className="text-xs text-[var(--color-text-muted)] mt-3 tracking-wide">
            与 AI 大师深入探讨您的命理疑问
          </p>
        </div>
      </div>
    </div>
  );
}
