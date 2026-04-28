'use client';

import { useState } from 'react';
import { useUser } from '@/app/lib/auth';
import { liuyaoApi, PaipanRequest, HexagramDetail } from '@/app/lib/liuyao/api';
import { getHexagramByName } from '@/app/lib/hexagram';
import MarkdownView from '@/app/components/Markdown';

// 问事场景配置
const QUESTION_SCENARIOS = [
  {
    id: 'relationship',
    label: '感情关系',
    placeholder: '例如：我是否应该主动联系对方？',
  },
  {
    id: 'career',
    label: '工作事业',
    placeholder: '例如：我是否应该接受这个工作机会？',
  },
  {
    id: 'business',
    label: '合作客户',
    placeholder: '例如：这个客户近期是否有机会成交？',
  },
  {
    id: 'wealth',
    label: '财运决策',
    placeholder: '例如：这个投资项目是否值得参与？',
  },
  {
    id: 'exam',
    label: '考试申请',
    placeholder: '例如：我这次考试能否顺利通过？',
  },
  {
    id: 'travel',
    label: '出行搬迁',
    placeholder: '例如：我是否应该接受外地的工作机会？',
  },
  {
    id: 'other',
    label: '其他',
    placeholder: '例如：我和对方的关系接下来会怎样？',
  },
];

export default function LiuyaoPage() {
  const { user } = useUser();
  const [method, setMethod] = useState<'number' | 'coin' | 'time'>('time');
  const [question, setQuestion] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [numbers, setNumbers] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HexagramDetail | null>(null);
  const [interpretation, setInterpretation] = useState<string>('');
  const [interpreting, setInterpreting] = useState(false);

  const currentPlaceholder = selectedScenario
    ? QUESTION_SCENARIOS.find(s => s.id === selectedScenario)?.placeholder
    : '例如：我是否应该接受这个工作机会？';

  const handleScenarioClick = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      alert('请输入问事内容');
      return;
    }

    if (method === 'number') {
      const nums = numbers.map(n => parseInt(n));
      if (nums.some(n => isNaN(n) || n <= 0)) {
        alert('请输入有效的数字');
        return;
      }
    }

    setLoading(true);
    try {
      const data: PaipanRequest = {
        question: question.trim(),
        method,
        numbers: method === 'number' ? numbers.map(n => parseInt(n)) : undefined,
      };

      const hexagram = await liuyaoApi.paipan(data);
      setResult(hexagram);
      setInterpretation('');
    } catch (error: any) {
      console.error('排盘失败:', error);
      alert(error.message || '排盘失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInterpret = async () => {
    if (!result) return;

    console.log('开始解卦，hexagram_id:', result.hexagram_id);
    setInterpreting(true);
    setInterpretation('');

    try {
      await liuyaoApi.interpretHexagram(
        result.hexagram_id,
        (chunk) => {
          console.log('收到chunk:', chunk);
          setInterpretation(prev => prev + chunk);
        },
        () => {
          console.log('解卦完成');
          setInterpreting(false);
          // 滚动到解卦结果
          setTimeout(() => {
            const resultElement = document.getElementById('interpretation-result');
            if (resultElement) {
              resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        },
        (error) => {
          console.error('解卦失败:', error);
          alert('解卦失败，请重试');
          setInterpreting(false);
        }
      );
    } catch (error: any) {
      console.error('解卦失败:', error);
      alert(error.message || '解卦失败，请重试');
      setInterpreting(false);
    }
  };

  const renderYaoLine = (line: any, index: number, isChangeGua = false) => {
    const isYang = line.is_yang;
    const isDong = line.is_dong;

    return (
      <div key={index} className="flex items-center gap-3 py-3 group">
        {/* 左侧：六亲 + 六兽 */}
        <div className="flex items-center gap-2 w-20 justify-end">
          <span className="text-xs tracking-wider text-stone-600 font-medium">
            {line.liuqin || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-500 font-light">
            {line.liushou || ''}
          </span>
        </div>

        {/* 中间：爻象 */}
        <div className="flex-1 flex items-center gap-2 relative">
          {isYang ? (
            <div
              className={`h-1.5 flex-1 transition-all duration-300 ${
                isDong && !isChangeGua
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(185,58,47,0.4)]'
                  : 'bg-stone-800'
              }`}
              style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
            />
          ) : (
            <div className="flex-1 flex gap-2">
              <div
                className={`h-1.5 flex-1 transition-all duration-300 ${
                  isDong && !isChangeGua
                    ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(185,58,47,0.4)]'
                    : 'bg-stone-800'
                }`}
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
              <div
                className={`h-1.5 flex-1 transition-all duration-300 ${
                  isDong && !isChangeGua
                    ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(185,58,47,0.4)]'
                    : 'bg-stone-800'
                }`}
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
            </div>
          )}
        </div>

        {/* 右侧：地支 + 五行 */}
        <div className="flex items-center gap-2 w-16">
          <span className="text-xs tracking-wider text-stone-500 font-light">
            {line.dizhi || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-600 font-medium">
            {line.wuxing || ''}
          </span>
        </div>
      </div>
    );
  };

  const renderChangeYaoLine = (mainLine: any, index: number) => {
    const isYang = mainLine.is_dong ? !mainLine.is_yang : mainLine.is_yang;
    const isDong = mainLine.is_dong;

    return (
      <div key={index} className="flex items-center gap-3 py-3 relative">
        {/* 动爻红框标注 */}
        {isDong && (
          <div className="absolute inset-0 -mx-2 border-2 border-red-500/60 rounded-md bg-red-50/10 pointer-events-none" />
        )}

        {/* 左侧：六亲 + 六兽（透明占位） */}
        <div className="flex items-center gap-2 w-20 justify-end opacity-0">
          <span className="text-xs tracking-wider text-stone-400 font-medium">
            {mainLine.liuqin || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-400 font-light">
            {mainLine.liushou || ''}
          </span>
        </div>

        {/* 中间：爻象 */}
        <div className="flex-1 flex items-center gap-2 relative z-10">
          {isYang ? (
            <div
              className="h-1.5 flex-1 bg-stone-600 opacity-60"
              style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
            />
          ) : (
            <div className="flex-1 flex gap-2">
              <div
                className="h-1.5 flex-1 bg-stone-600 opacity-60"
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
              <div
                className="h-1.5 flex-1 bg-stone-600 opacity-60"
                style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 50%, 98% 100%, 2% 100%, 0% 50%)' }}
              />
            </div>
          )}
        </div>

        {/* 右侧：地支 + 五行（透明占位） */}
        <div className="flex items-center gap-2 w-16 opacity-0">
          <span className="text-xs tracking-wider text-stone-400 font-light">
            {mainLine.dizhi || ''}
          </span>
          <span className="text-xs tracking-wider text-stone-400 font-medium">
            {mainLine.wuxing || ''}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF9EA]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-[#1F2937] mb-3 tracking-wide">
            六爻问事
          </h1>
          <p className="text-lg text-gray-600 font-light">
            一事一卦，看趋势、看风险、看下一步
          </p>
        </div>

        {!result ? (
          /* 起卦表单 */
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-10 border border-gray-100">
            {/* 引导语 */}
            <div className="text-center mb-8 pb-6 border-b border-gray-100">
              <p className="text-gray-600 text-base leading-relaxed">
                静心想一件你最想确认的事，然后开始起卦
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: 问事内容 */}
              <div>
                <label className="block text-lg font-medium text-[#1F2937] mb-3">
                  你想问什么事？
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  请只问一件具体的事，问题越明确，解读越准确
                </p>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={currentPlaceholder}
                  className="w-full h-28 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#B93A2F] focus:border-transparent transition-all text-base"
                  disabled={!user}
                />
              </div>

              {/* Step 2: 问事场景标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  常见问题
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => handleScenarioClick(scenario.id)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        selectedScenario === scenario.id
                          ? 'bg-[#B93A2F] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {scenario.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: 起卦方式 */}
              <div>
                <label className="block text-lg font-medium text-[#1F2937] mb-3">
                  选择起卦方式
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 一键起卦 */}
                  <button
                    type="button"
                    onClick={() => setMethod('time')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      method === 'time'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base">一键起卦</span>
                      {method === 'time' && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">推荐</span>
                      )}
                    </div>
                    <p className={`text-sm ${method === 'time' ? 'text-white/90' : 'text-gray-500'}`}>
                      根据当前时间自动起卦，适合快速问事
                    </p>
                  </button>

                  {/* 数字起卦 */}
                  <button
                    type="button"
                    onClick={() => setMethod('number')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      method === 'number'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    <div className="font-semibold text-base mb-2">数字起卦</div>
                    <p className={`text-sm ${method === 'number' ? 'text-white/90' : 'text-gray-500'}`}>
                      凭第一感觉输入三个数字
                    </p>
                  </button>

                  {/* 铜钱起卦 */}
                  <button
                    type="button"
                    onClick={() => setMethod('coin')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      method === 'coin'
                        ? 'border-[#B93A2F] bg-[#B93A2F] text-white shadow-lg'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#B93A2F]'
                    }`}
                  >
                    <div className="font-semibold text-base mb-2">铜钱起卦</div>
                    <p className={`text-sm ${method === 'coin' ? 'text-white/90' : 'text-gray-500'}`}>
                      模拟传统铜钱起卦，更有仪式感
                    </p>
                  </button>
                </div>
              </div>

              {/* 数字输入（仅在选择数字起卦时显示） */}
              {method === 'number' && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    请输入三个数字
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {numbers.map((num, index) => (
                      <input
                        key={index}
                        type="number"
                        value={num}
                        onChange={(e) => {
                          const newNumbers = [...numbers];
                          newNumbers[index] = e.target.value;
                          setNumbers(newNumbers);
                        }}
                        placeholder={`第${index + 1}个数字`}
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B93A2F] focus:border-transparent text-center text-lg"
                        min="1"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    不必刻意思考，凭第一感觉输入即可
                  </p>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex justify-center pt-4">
                {user ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-16 py-4 bg-[#B93A2F] text-white text-lg font-medium rounded-lg hover:bg-[#9a2f26] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? '解卦中...' : '立即解卦'}
                  </button>
                ) : (
                  <div className="text-gray-500 text-center">
                    <p className="mb-3">请先登录以使用六爻问事功能</p>
                    <a href="/login" className="text-[#B93A2F] hover:underline">
                      前往登录
                    </a>
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* 卦象结果 - 双卦象展示 */
          <div className="relative">
            {/* 背景纹理 */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* 主内容区 */}
            <div className="relative bg-gradient-to-b from-stone-50 via-amber-50/30 to-stone-50 rounded-2xl shadow-2xl border border-stone-200/50 overflow-hidden">
              {/* 顶部装饰线 */}
              <div className="h-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

              {/* 问事内容和基本信息 */}
              <div className="px-8 pt-10 pb-6 border-b border-stone-200/50">
                <div className="max-w-3xl mx-auto">
                  {/* 问事内容 */}
                  <div className="text-center mb-6">
                    <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-3 font-light">
                      所问之事
                    </p>
                    <h2 className="text-2xl text-stone-800 leading-relaxed font-light tracking-wide">
                      {result.question}
                    </h2>
                  </div>

                  {/* 基本信息 */}
                  <div className="mt-6 pt-6 border-t border-stone-200/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-stone-400 text-xs mb-1">性别</p>
                        <p className="text-stone-700">
                          {result.gender === 'male' ? '男' : result.gender === 'female' ? '女' : '未知'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-stone-400 text-xs mb-1">排法</p>
                        <p className="text-stone-700">
                          {result.method === 'time' ? '时间起卦' : result.method === 'number' ? '数字起卦' : '铜钱起卦'}
                        </p>
                      </div>
                      <div className="text-center md:col-span-2">
                        <p className="text-stone-400 text-xs mb-1">时间</p>
                        <p className="text-stone-700">
                          {new Date(result.timestamp).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* 干支信息 */}
                    {result.ganzhi && (
                      <div className="mt-4 pt-4 border-t border-stone-200/30">
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400 text-xs">年</span>
                            <span className="text-stone-700 font-medium">{result.ganzhi.year}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400 text-xs">月</span>
                            <span className="text-stone-700 font-medium">{result.ganzhi.month}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400 text-xs">日</span>
                            <span className="text-stone-700 font-medium">{result.ganzhi.day}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400 text-xs">时</span>
                            <span className="text-stone-700 font-medium">{result.ganzhi.hour}</span>
                          </div>
                          {result.jiqi?.current && (
                            <div className="flex items-center gap-2">
                              <span className="text-stone-400 text-xs">节气</span>
                              <span className="text-stone-700 font-medium">{result.jiqi.current}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 双卦象展示区 */}
              <div className="px-8 py-12">
                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
                    {/* 本卦 */}
                    <div className="relative">
                      {/* 卦名 */}
                      <div className="text-center mb-8">
                        <div className="inline-block relative">
                          <h3
                            className="text-5xl font-serif text-stone-900 tracking-wider relative z-10"
                            style={{ fontFamily: "'Noto Serif SC', serif" }}
                          >
                            {result.main_gua}
                          </h3>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-1">
                          <p className="text-xs tracking-[0.25em] text-stone-500 uppercase font-light">
                            本卦
                          </p>
                          {(() => {
                            const hexInfo = getHexagramByName(result.main_gua);
                            if (hexInfo) {
                              return (
                                <p className="text-xs text-stone-600 font-light">
                                  第 {hexInfo.number} 卦
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* 六爻图 */}
                      {result.lines && result.lines.lines && (
                        <div className="relative">
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-stone-200/50">
                            {[...result.lines.lines].reverse().map((line, index) =>
                              renderYaoLine(line, result.lines!.lines.length - 1 - index, false)
                            )}
                          </div>

                          {/* 世应爻标注 */}
                          <div className="mt-6 flex justify-center gap-8 text-xs tracking-wider text-stone-500">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                              世爻：第{result.shi_yao}爻
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-500/60" />
                              应爻：第{result.ying_yao}爻
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 变卦 */}
                    {result.change_gua && result.lines && result.lines.lines ? (
                      <div className="relative">
                        {/* 连接箭头 (仅桌面显示) */}
                        <div className="hidden md:block absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                          <div className="flex flex-col items-center gap-2">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 32 32"
                              fill="none"
                              className="text-red-600/40"
                            >
                              <path
                                d="M8 16H24M24 16L18 10M24 16L18 22"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="text-[10px] tracking-widest text-red-600/60 uppercase font-light">
                              变
                            </span>
                          </div>
                        </div>

                        {/* 卦名 */}
                        <div className="text-center mb-8">
                          <div className="inline-block relative">
                            <h3
                              className="text-5xl font-serif text-stone-800 tracking-wider relative z-10"
                              style={{ fontFamily: "'Noto Serif SC', serif" }}
                            >
                              {result.change_gua}
                            </h3>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
                          </div>
                          <div className="mt-4 flex flex-col items-center gap-1">
                            <p className="text-xs tracking-[0.25em] text-stone-400 uppercase font-light">
                              变卦
                            </p>
                            {(() => {
                              const hexInfo = getHexagramByName(result.change_gua);
                              if (hexInfo) {
                                return (
                                  <p className="text-xs text-stone-500 font-light">
                                    第 {hexInfo.number} 卦
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>

                        {/* 六爻图 */}
                        <div className="relative">
                          <div className="bg-stone-100/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-stone-200/30">
                            {[...result.lines.lines].reverse().map((line, index) =>
                              renderChangeYaoLine(line, result.lines!.lines.length - 1 - index)
                            )}
                          </div>

                          {/* 变化说明 */}
                          <div className="mt-6 text-center">
                            <p className="text-xs text-stone-400 tracking-wide font-light">
                              动爻变化后的卦象
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 无变卦时显示占位 */
                      <div className="relative flex items-center justify-center">
                        <div className="text-center py-20">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 32 32"
                              fill="none"
                              className="text-stone-300"
                            >
                              <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
                              <path
                                d="M16 12V16M16 20H16.01"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-stone-400 tracking-wide font-light">
                            此卦无动爻，无变卦
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部操作区 */}
              <div className="px-8 pb-10 pt-6 border-t border-stone-200/50 bg-gradient-to-b from-transparent to-stone-50/50">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button
                    onClick={() => {
                      setResult(null);
                      setInterpretation('');
                    }}
                    className="group px-10 py-3.5 bg-white text-stone-700 border border-stone-300 rounded-full hover:border-red-600 hover:text-red-600 transition-all duration-300 shadow-sm hover:shadow-md text-sm tracking-wider font-light"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="transition-transform group-hover:rotate-180 duration-500"
                      >
                        <path
                          d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 2L8 6M8 2L11 2M8 2L8 2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      重新起卦
                    </span>
                  </button>
                  <button
                    onClick={handleInterpret}
                    disabled={interpreting}
                    className="px-10 py-3.5 bg-[#B93A2F] text-white rounded-full hover:bg-[#9a2f26] transition-all duration-300 shadow-lg hover:shadow-xl text-sm tracking-wider font-light disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {interpreting ? 'AI 解卦中...' : 'AI 解卦'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI解卦结果 */}
            {interpretation && (
              <div id="interpretation-result" className="mt-8 bg-white rounded-2xl shadow-xl border border-stone-200/50 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
                <div className="px-8 py-10">
                  <div className="max-w-3xl mx-auto">
                    <div className="mb-6 text-center">
                      <h3 className="text-2xl font-serif text-stone-800 tracking-wide">
                        AI 解卦
                      </h3>
                    </div>
                    <MarkdownView content={interpretation} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 价值说明卡片 */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-semibold text-[#1F2937] text-lg mb-2">一事一问</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                六爻适合判断具体事情，不建议一次问多个问题
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-[#1F2937] text-lg mb-2">看清趋势</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                不只判断吉凶，还会分析阻力、机会和变化方向
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-semibold text-[#1F2937] text-lg mb-2">给出建议</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                根据卦象生成下一步行动建议，帮助你做决策
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
