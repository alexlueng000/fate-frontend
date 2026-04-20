'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { getAuthToken } from '@/app/lib/auth';
import { api } from '@/app/lib/api';
import Markdown from '@/app/components/Markdown';
import { WuxingBadge, WuxingBar, getWuxing, colorClasses, type Wuxing } from '@/app/components/WuXing';
import { Paipan } from '@/app/lib/chat/types';
import { trySSE } from '@/app/lib/chat/sse';
import { savePaipanLocal, saveConversation } from '@/app/lib/chat/storage';

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

        // 3. 获取 AI 分析报告（流式）
        setStreaming(true);
        let convId = '';
        let finalText = '';

        try {
          await trySSE(
            api('/chat/start'),
            { paipan: mingpan },
            (text) => {
              finalText = text;
              setAiReport(text);
            },
            (meta) => {
              const metaObj = meta as any;
              const cid = metaObj?.conversation_id || metaObj?.meta?.conversation_id || '';
              if (cid) {
                convId = cid;
                setConversationId(cid);
              }
            }
          );

          setStreaming(false);

          if (convId && finalText) {
            saveConversation(convId, [
              { role: 'assistant', content: finalText },
            ]);
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
    router.push('/chat');
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
    <div className="min-h-screen bg-[#F5EFE6]" ref={scrollRef}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-800 mb-3 tracking-tight">
            命理分析报告
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 mb-4">
            {profile?.display_info || '您的八字命盘详细解读'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-16 bg-neutral-300" />
            <span className="text-[10px] tracking-[0.3em] text-neutral-400 font-medium">一盏大师</span>
            <span className="h-px w-16 bg-neutral-300" />
          </div>
        </div>

        {/* 四柱展示 */}
        {paipan && (
          <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 mb-8">
            <h3 className="text-sm font-bold text-[#a83232] mb-4 tracking-wide">四柱命盘</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: '年柱', pillar: paipan.four_pillars.year },
                { label: '月柱', pillar: paipan.four_pillars.month },
                { label: '日柱', pillar: paipan.four_pillars.day },
                { label: '时柱', pillar: paipan.four_pillars.hour },
              ].map(({ label, pillar }) => (
                <div
                  key={label}
                  className="bg-white border border-[#E0D5C8] rounded-xl p-4 text-center"
                >
                  <div className="text-xs text-neutral-500 mb-2">{label}</div>
                  <div className="flex items-center justify-center gap-2">
                    <WuxingBadge char={pillar?.[0] || ''} />
                    <WuxingBadge char={pillar?.[1] || ''} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 五行平衡 */}
        <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-sm font-bold text-[#a83232] mb-4 tracking-wide">五行平衡</h3>
          <div className="space-y-3">
            {(['木', '火', '土', '金', '水'] as Wuxing[]).map((el) => (
              <WuxingBar key={el} name={el} percent={20} />
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-4">
            * 五行分布数据待后端接口完善
          </p>
        </div>

        {/* AI 分析报告 */}
        <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
          <h3 className="text-sm font-bold text-[#a83232] mb-4 tracking-wide">命理解读</h3>
          {streaming && !aiReport && (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-[#a83232] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-neutral-500">AI 正在分析您的命盘...</p>
            </div>
          )}
          {aiReport && (
            <div className="prose prose-neutral max-w-none">
              <Markdown content={aiReport} />
            </div>
          )}
          {streaming && aiReport && (
            <div className="mt-4 text-xs text-neutral-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#a83232] rounded-full animate-pulse" />
              正在生成中...
            </div>
          )}
          {error && !aiReport && (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* 大运展示 */}
        {paipan && paipan.dayun && paipan.dayun.length > 0 && (
          <div className="bg-[#FAF6F1] border border-[#E0D5C8] rounded-2xl shadow-sm p-6 mb-8">
            <h3 className="text-sm font-bold text-[#a83232] mb-4 tracking-wide">十年大运</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {paipan.dayun.map((d, i) => {
                const pillar = d.pillar?.join('') || '';
                const gan = pillar?.[0] || '';
                const el = getWuxing(gan) || '火';
                return (
                  <div
                    key={i}
                    className={`shrink-0 rounded-xl border ${colorClasses(el, 'border')} bg-white px-4 py-3 text-xs text-neutral-900 min-w-[160px] shadow-sm`}
                  >
                    <div>起运年龄：<span className={`${colorClasses(el, 'text')} font-semibold`}>{d.age}</span></div>
                    <div className="mt-0.5">起运年份：<span className={`${colorClasses(el, 'text')} font-semibold`}>{d.start_year}</span></div>
                    <div className="mt-1">大运：<span className={`font-bold ${colorClasses(el, 'text')}`}>{pillar || '—'}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 开始对话按钮 */}
        <div className="text-center">
          <button
            onClick={handleStartChat}
            disabled={streaming}
            className="px-8 py-4 rounded-xl bg-[#a83232] hover:bg-[#8c2b2b] active:bg-[#7a2626] text-white font-semibold text-base tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {streaming ? '分析中...' : '开始对话'}
          </button>
          <p className="text-xs text-neutral-400 mt-3">
            与 AI 大师深入探讨您的命理疑问
          </p>
        </div>
      </div>
    </div>
  );
}
