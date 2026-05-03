'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { getAuthToken } from '@/app/lib/auth';
import { api } from '@/app/lib/api';
import Markdown from '@/app/components/Markdown';
import { WuxingBadge, getWuxing, colorClasses } from '@/app/components/WuXing';
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

  // 自动滚动到底部
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

        // 1. 获取档案信息
        const profileResp = await fetch(api('/profile/me'), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });

        if (!profileResp.ok) {
          throw new Error('获取档案失败');
        }

        const profileData = await profileResp.json();
        setProfile(profileData);

        // 2. 计算命盘
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
            birth_time: profileData.birth_time.substring(0, 5), // 截取 HH:MM 部分
            birthplace: profileData.birth_location,
          }),
        });

        if (!paipanResp.ok) {
          throw new Error('计算命盘失败');
        }

        const paipanData = await paipanResp.json();

        // 解包 mingpan 层
        const mingpan = paipanData.mingpan || paipanData;
        setPaipan(mingpan);

        // 缓存命盘数据
        savePaipanLocal(mingpan);

        // 3. 有已保存报告直接展示，否则请求 AI 生成并保存
        if (profileData.ai_report) {
          setAiReport(profileData.ai_report);

          // 若有缓存对话也顺便恢复一下，允许继续对话
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
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="text-neutral-500 tracking-widest text-sm">加载中...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/profile/create')}
            className="px-6 py-2 rounded-xl bg-[#a83232] text-white hover:bg-[#8c2b2b] transition-colors"
          >
            返回建档
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFE6] via-[#FAF6F1] to-[#F5EFE6]" ref={scrollRef}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-800 mb-6 tracking-tight">
            命理分析报告
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 mb-6">
            {profile?.display_info || '您的八字命盘详细解读'}
          </p>
        </div>

        {/* 四柱展示 */}
        {paipan && (
          <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-[#a83232] rounded-full" />
              <h3 className="text-sm font-bold text-neutral-800 tracking-wide">四柱命盘</h3>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-5">
              {[
                { label: '年柱', pillar: paipan.four_pillars.year, sublabel: '祖上・家庭' },
                { label: '月柱', pillar: paipan.four_pillars.month, sublabel: '父母・早年' },
                { label: '日柱', pillar: paipan.four_pillars.day, sublabel: '本人・婚姻', highlight: true },
                { label: '时柱', pillar: paipan.four_pillars.hour, sublabel: '子女・晚年' },
              ].map(({ label, pillar, sublabel, highlight }) => (
                <div
                  key={label}
                  className={`rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center gap-2 ${
                    highlight
                      ? 'bg-[#a83232]/5 border-2 border-[#a83232]/30 shadow-sm'
                      : 'bg-white border border-[#E0D5C8]'
                  }`}
                >
                  {highlight && (
                    <div className="text-[9px] tracking-widest text-[#a83232] font-bold -mb-1">日主</div>
                  )}
                  <div className={`text-xs font-medium ${highlight ? 'text-[#a83232]' : 'text-neutral-400'}`}>{label}</div>
                  <div className="flex flex-col items-center gap-1.5">
                    <WuxingBadge char={pillar?.[0] || ''} />
                    <WuxingBadge char={pillar?.[1] || ''} />
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-1">{sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 详细排盘 */}
        {paipan && (
          <div className="mb-8">
            <DetailedPaipanTable paipan={paipan} />
          </div>
        )}

        {/* 十年大运 - 移到详细排盘下方 */}
        {paipan && paipan.dayun && paipan.dayun.length > 0 && (
          <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-4 bg-[#a83232] rounded-full" />
              <h3 className="text-sm font-bold text-neutral-800 tracking-wide">十年大运</h3>
              <span className="text-xs text-neutral-400 ml-2">共 {paipan.dayun.length} 步大运</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {paipan.dayun.map((d, i) => {
                const pillar = d.pillar?.join('') || '';
                const gan = pillar?.[0] || '';
                const el = getWuxing(gan) || '火';
                return (
                  <div
                    key={i}
                    className={`relative rounded-xl border-2 ${colorClasses(el, 'border')} bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
                  >
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-xs">起运年龄</span>
                        <span className={`${colorClasses(el, 'text')} font-bold text-base`}>{d.age} 岁</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-xs">起运年份</span>
                        <span className={`${colorClasses(el, 'text')} font-semibold`}>{d.start_year}</span>
                      </div>
                      <div className={`pt-2.5 border-t ${colorClasses(el, 'border')} border-opacity-20`}>
                        <div className="text-center">
                          <div className="text-[10px] text-neutral-400 mb-1.5 tracking-wider">大运干支</div>
                          <div className={`text-3xl font-bold ${colorClasses(el, 'text')} tracking-wider`}>
                            {pillar || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI 分析报告 */}
        <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-[#a83232] rounded-full" />
            <h3 className="text-sm font-bold text-neutral-800 tracking-wide">命理解读</h3>
          </div>
          {streaming && !aiReport && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-3 border-[#a83232] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-neutral-500">AI 正在分析您的命盘...</p>
            </div>
          )}
          {aiReport && (
            <div className="prose prose-neutral max-w-none prose-headings:text-neutral-800 prose-p:text-neutral-700 prose-p:leading-relaxed">
              <Markdown content={aiReport} />
            </div>
          )}
          {streaming && aiReport && (
            <div className="mt-6 pt-4 border-t border-neutral-200 text-xs text-neutral-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#a83232] rounded-full animate-pulse" />
              正在生成中...
            </div>
          )}
          {error && !aiReport && (
            <div className="text-center py-12 text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* 开始对话按钮 */}
        <div className="text-center pb-8">
          <button
            onClick={handleStartChat}
            disabled={streaming}
            className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-[#a83232] to-[#8c2b2b] hover:from-[#8c2b2b] hover:to-[#7a2626] active:scale-95 text-white font-semibold text-base tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <span className="relative z-10">{streaming ? '分析中...' : '开始对话'}</span>
            <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
          <p className="text-xs text-neutral-400 mt-4 tracking-wide">
            与 AI 大师深入探讨您的命理疑问
          </p>
        </div>
      </div>
    </div>
  );
}
