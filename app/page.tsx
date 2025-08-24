'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Gender = '男' | '女';
type Calendar = 'gregorian' | 'lunar';

type FourPillars = { year: string[]; month: string[]; day: string[]; hour: string[] };
type DayunItem = { age: number; start_year: number; pillar: string[] };
type Mingpan = { four_pillars: FourPillars; dayun: DayunItem[] };

const API = process.env.NEXT_PUBLIC_API_BASE;

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
    if (!API) { setError('缺少 NEXT_PUBLIC_API_BASE 环境变量'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/bazi/calc_paipan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          calendar,              // 'gregorian' / 'lunar'
          birth_date: birthDate, // 'YYYY-MM-DD'
          birth_time: birthTime, // 'HH:MM'
          birthplace,            // 城市名
          use_true_solar: true,  // 真太阳时
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

  return (
    <main className="min-h-screen bg-[#f6f1e8] p-6 sm:p-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">

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
        </div>


        {/* ===== 八字排盘卡片（基于后端返回渲染） ===== */}
        <div className="rounded-3xl bg-white/90 shadow ring-1 ring-black/5">
          <div className="flex items-center justify-between px-6 py-5">
            <h1 className="text-xl font-semibold tracking-wide text-stone-800">八字排盘</h1>
            <button
              type="button"
              onClick={goChat}
              disabled={!mingpan}
              className="rounded-full bg-rose-50 px-3 py-1.5 text-sm text-rose-600 ring-1 ring-rose-100 disabled:opacity-50"
              title={!mingpan ? '请先提交计算' : '跳转到对话页'}
            >
              💬 咨询解读
            </button>
          </div>

          <div className="px-6 pb-6">
            {/* 四柱表（仅展示天干；地支/长生可扩展） */}
            <div className="overflow-hidden rounded-2xl ring-1 ring-stone-200">
              <table className="w-full border-collapse text-center text-[15px]">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    {['四柱','年柱','月柱','日柱','时柱'].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-stone-800">
                  <tr className="border-t border-stone-200">
                    <td className="px-3 py-3">天干</td>
                    <td className="px-3 py-3">{j(mingpan?.four_pillars.year)}</td>
                    <td className="px-3 py-3">{j(mingpan?.four_pillars.month)}</td>
                    <td className="px-3 py-3">{j(mingpan?.four_pillars.day)}</td>
                    <td className="px-3 py-3">{j(mingpan?.four_pillars.hour)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 大运 */}
            <section className="mt-5 rounded-2xl bg-stone-50 p-4">
              <h2 className="mb-3 text-stone-700">大运</h2>
              <div className="flex flex-wrap gap-3">
                {(mingpan?.dayun || []).slice(0, 10).map((d, i) => (
                  <div
                    key={i}
                    className="flex min-w-[88px] flex-col items-center gap-1 rounded-2xl bg-white px-4 py-2.5 text-stone-800 ring-1 ring-stone-200"
                  >
                    <div className="text-[15px]">{j(d.pillar)}</div>
                    <div className="text-xs text-stone-500">{d.age}岁</div>
                  </div>
                ))}
                {!mingpan && <div className="text-sm text-stone-500">提交后展示大运</div>}
              </div>
            </section>
          </div>
        </div>

      </div>
    </main>
  );
}
