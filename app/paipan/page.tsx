'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateDetailedPaipan } from '@/app/lib/bazi/calculator';
import { getWuxing, colorClasses, type Wuxing } from '@/app/components/WuXing';

type Gender = '男' | '女';
type Calendar = 'gregorian' | 'lunar';

type FourPillars = { year: string[]; month: string[]; day: string[]; hour: string[] };
type DayunItem = { age: number; start_year: number; pillar: string[] };
type Mingpan = { four_pillars: FourPillars; dayun: DayunItem[] };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function Page() {
  const router = useRouter();

  // 表单
  const [gender, setGender] = useState<Gender>('男');
  const [calendar, setCalendar] = useState<Calendar>('gregorian');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthplace, setBirthplace] = useState('');

  // 状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [birthdayAdjusted, setBirthdayAdjusted] = useState<string | null>(null);
  const [mingpan, setMingpan] = useState<Mingpan | null>(null);

  // 提交到后端进行排盘
  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      // ✅ 如果配置了 NEXT_PUBLIC_API_BASE，就用它直连后端；
      // ✅ 否则默认走同域反代的 /api 前缀（Nginx -> 127.0.0.1:8000）
      const endpoint = API_BASE
        ? `${API_BASE}/bazi/calc_paipan`
        : `/api/bazi/calc_paipan`;
  
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          calendar,
          birth_date: birthDate,
          birth_time: birthTime,
          birthplace,
          use_true_solar: true,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBirthdayAdjusted(data.birthday_adjusted || null);
      setMingpan(data.mingpan || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // 跳到 /chat：只存命盘，立刻跳转。/chat 页面会显示“正在解读中…”并调用 /chat/start
  const goChat = () => {
    if (!mingpan) {
      alert('请先提交计算，生成排盘结果。');
      return;
    }
    try {
      sessionStorage.setItem('paipan', JSON.stringify({
        four_pillars: mingpan.four_pillars,
        dayun: mingpan.dayun,
      }));
      // 清掉旧的会话（可选，避免串会话）
      sessionStorage.removeItem('conversation_id');
      sessionStorage.removeItem('bootstrap_reply');
      router.push('/chat');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const j = (x?: string[]) => (x && x.length ? x.join('') : '（空）');

  // 计算五行分布
  const calculateWuxingDistribution = () => {
    if (!mingpan) return null;
    const counts: Record<Wuxing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    const allChars = [
      ...mingpan.four_pillars.year,
      ...mingpan.four_pillars.month,
      ...mingpan.four_pillars.day,
      ...mingpan.four_pillars.hour,
    ];
    allChars.forEach(char => {
      const wx = getWuxing(char);
      if (wx) counts[wx]++;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([name, count]) => ({
      name: name as Wuxing,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  };

  const wuxingData = calculateWuxingDistribution();
  const detailedPaipan = mingpan ? calculateDetailedPaipan(mingpan) : null;

  return (
    <main className="min-h-screen bg-[#f6f1e8] p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">

        {/* ===== 信息输入表单 ===== */}
        <div className="rounded-3xl bg-white/90 p-6 shadow ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-stone-800">基本信息</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-stone-600">性别</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm
                          text-stone-900 bg-white placeholder-stone-500"
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-stone-600">历法</label>
              <select
                value={calendar}
                onChange={(e) => setCalendar(e.target.value as Calendar)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm
                          text-stone-900 bg-white placeholder-stone-500"
              >
                <option value="gregorian">公历</option>
                <option value="lunar">农历</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-stone-600">出生日期</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm
                          text-stone-900 bg-white placeholder-stone-500"
              />
            </div>

            <div>
              <label className="text-sm text-stone-600">出生时间</label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm
                          text-stone-900 bg-white placeholder-stone-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-stone-600">出生地</label>
              <input
                type="text"
                value={birthplace}
                onChange={(e) => setBirthplace(e.target.value)}
                placeholder="例如：广东阳春"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm
                          text-stone-900 bg-white placeholder-stone-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-start">
            <button
              onClick={onSubmit}
              disabled={loading || !birthDate || !birthTime || !birthplace}
              className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-medium text-white 
                        shadow hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed"
            >
              {loading ? '计算中…' : '开始排盘'}
            </button>
          </div>
        </div>


        {/* ===== 命理分析报告标题 ===== */}
        {mingpan && (
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-stone-800">命理分析报告</h1>
            <div className="text-sm text-stone-600">
              {gender} | {birthDate} {birthTime} | {birthplace}
            </div>
            <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-stone-400 to-transparent" />
          </div>
        )}

        {/* ===== 四柱命盘卡片 ===== */}
        <div className="rounded-3xl bg-white/90 shadow-lg ring-1 ring-black/5">
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
            <h2 className="text-lg font-semibold text-[#a83232]">详细排盘</h2>
            <button
              type="button"
              onClick={goChat}
              disabled={!mingpan}
              className="rounded-full bg-[#a83232] px-4 py-2 text-sm font-medium text-white hover:bg-[#8c2b2b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={!mingpan ? '请先提交计算' : '跳转到对话页'}
            >
              💬 咨询解读
            </button>
          </div>

          <div className="px-6 py-6">
            {mingpan && detailedPaipan ? (
              // 详细视图 - 详细排盘表
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600">项目</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600">年柱</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600">月柱</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-amber-700 bg-amber-50">日柱</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600">时柱</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 天干 */}
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">天干</td>
                      {[
                        detailedPaipan.four_pillars.year[0],
                        detailedPaipan.four_pillars.month[0],
                        detailedPaipan.four_pillars.day[0],
                        detailedPaipan.four_pillars.hour[0],
                      ].map((gan, idx) => {
                        const wx = getWuxing(gan);
                        return (
                          <td key={idx} className={`px-4 py-3 text-center ${idx === 2 ? 'bg-amber-50/30' : ''}`}>
                            <span className={`text-xl font-serif font-bold ${wx ? colorClasses(wx, 'text') : 'text-stone-800'}`}>
                              {gan}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* 地支 */}
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">地支</td>
                      {[
                        detailedPaipan.four_pillars.year[1],
                        detailedPaipan.four_pillars.month[1],
                        detailedPaipan.four_pillars.day[1],
                        detailedPaipan.four_pillars.hour[1],
                      ].map((zhi, idx) => {
                        const wx = getWuxing(zhi);
                        return (
                          <td key={idx} className={`px-4 py-3 text-center ${idx === 2 ? 'bg-amber-50/30' : ''}`}>
                            <span className={`text-xl font-serif font-bold ${wx ? colorClasses(wx, 'text') : 'text-stone-800'}`}>
                              {zhi}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* 藏干 */}
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">藏干</td>
                      {[
                        detailedPaipan.cang_gan.year,
                        detailedPaipan.cang_gan.month,
                        detailedPaipan.cang_gan.day,
                        detailedPaipan.cang_gan.hour,
                      ].map((cangGanList, idx) => (
                        <td key={idx} className={`px-4 py-3 text-center text-xs ${idx === 2 ? 'bg-amber-50/30' : ''}`}>
                          {cangGanList.map((gan, i) => {
                            const wx = getWuxing(gan);
                            return (
                              <span key={i} className={`font-serif ${wx ? colorClasses(wx, 'text') : 'text-stone-800'}`}>
                                {gan}
                                {wx && `(${wx})`}
                                {i < cangGanList.length - 1 ? ' ' : ''}
                              </span>
                            );
                          })}
                        </td>
                      ))}
                    </tr>

                    {/* 十神（天干）*/}
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">十神（天干）</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.shi_shen_gan.year}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.shi_shen_gan.month}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800 bg-amber-50/30">{detailedPaipan.shi_shen_gan.day}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.shi_shen_gan.hour}</td>
                    </tr>

                    {/* 十神（地支）*/}
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">十神（地支）</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.shi_shen_zhi.year}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.shi_shen_zhi.month}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800 bg-amber-50/30">{detailedPaipan.shi_shen_zhi.day}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.shi_shen_zhi.hour}</td>
                    </tr>

                    {/* 十二长生 */}
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">十二长生</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.chang_sheng.year}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.chang_sheng.month}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800 bg-amber-50/30">{detailedPaipan.chang_sheng.day}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.chang_sheng.hour}</td>
                    </tr>

                    {/* 纳音 */}
                    <tr className="border-b border-stone-100">
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">纳音</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.na_yin.year}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.na_yin.month}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800 bg-amber-50/30">{detailedPaipan.na_yin.day}</td>
                      <td className="px-4 py-3 text-center text-xs text-stone-800">{detailedPaipan.na_yin.hour}</td>
                    </tr>

                    {/* 空亡 */}
                    <tr>
                      <td className="px-4 py-3 text-xs font-medium text-stone-700">空亡</td>
                      <td colSpan={4} className="px-4 py-3 text-center text-xs text-stone-800">
                        {detailedPaipan.xun_kong || '无'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500">请先提交计算，生成排盘结果</div>
            )}
          </div>
        </div>

        {/* ===== 五行平衡 ===== */}
        {wuxingData && (
          <div className="rounded-3xl bg-white/90 shadow-lg ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#a83232] mb-4">五行平衡</h2>
            <div className="space-y-3">
              {wuxingData.map(({ name, percent }) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-semibold ${colorClasses(name, 'text')}`}>{name}</span>
                    <span className="text-stone-600">{percent}%</span>
                  </div>
                  <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${colorClasses(name, 'text').replace('text-', 'bg-')}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-4">* 五行分布数据由命盘口诀计算</p>
          </div>
        )}
        {/* ===== 大运 ===== */}
        {mingpan && (
          <div className="rounded-3xl bg-white/90 shadow-lg ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#a83232] mb-4">大运</h2>
            <div className="flex flex-wrap gap-3">
              {mingpan.dayun.slice(0, 10).map((d, i) => {
                const ganWuxing = getWuxing(d.pillar[0]);
                const zhiWuxing = getWuxing(d.pillar[1]);
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-stone-50 border border-stone-200 px-4 py-3 min-w-[90px]"
                  >
                    <div className="flex items-center gap-1">
                      <span className={`text-xl font-serif font-bold ${ganWuxing ? colorClasses(ganWuxing, 'text') : 'text-stone-800'}`}>
                        {d.pillar[0]}
                      </span>
                      <span className={`text-xl font-serif font-bold ${zhiWuxing ? colorClasses(zhiWuxing, 'text') : 'text-stone-800'}`}>
                        {d.pillar[1]}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 font-sans">{d.age}岁起</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
