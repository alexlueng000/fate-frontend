'use client';

import { useState } from 'react';
import { useUser } from '@/app/lib/auth';
import { liuyaoApi, PaipanRequest, HexagramDetail } from '@/app/lib/liuyao/api';

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
    } catch (error: any) {
      console.error('排盘失败:', error);
      alert(error.message || '排盘失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderYaoLine = (line: any, index: number) => {
    const isYang = line.is_yang;
    const isDong = line.is_dong;

    return (
      <div key={index} className="flex items-center gap-4 py-2">
        <span className="text-sm text-gray-600 w-16">{line.liushou || ''}</span>
        <div className="flex-1 flex items-center gap-2">
          {isYang ? (
            <div className={`h-2 flex-1 rounded ${isDong ? 'bg-[#B93A2F]' : 'bg-gray-800'}`} />
          ) : (
            <div className="flex-1 flex gap-2">
              <div className={`h-2 flex-1 rounded ${isDong ? 'bg-[#B93A2F]' : 'bg-gray-800'}`} />
              <div className={`h-2 flex-1 rounded ${isDong ? 'bg-[#B93A2F]' : 'bg-gray-800'}`} />
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600 w-12">{line.dizhi || ''}</span>
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
          /* 卦象结果 */
          <div className="space-y-6">
            {/* 卦象信息 */}
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#1F2937] mb-3">
                  {result.main_gua}
                </h2>
                {result.change_gua && (
                  <p className="text-gray-600 text-lg">变卦：{result.change_gua}</p>
                )}
              </div>

              {/* 六爻图 */}
              {result.lines && result.lines.lines && (
                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6">
                  {[...result.lines.lines].reverse().map((line, index) =>
                    renderYaoLine(line, result.lines!.lines.length - 1 - index)
                  )}
                </div>
              )}

              {/* 世应爻 */}
              <div className="mt-6 text-center text-sm text-gray-600">
                世爻：第{result.shi_yao}爻 | 应爻：第{result.ying_yao}爻
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setResult(null)}
                className="px-8 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-[#B93A2F] hover:text-[#B93A2F] transition-all"
              >
                重新起卦
              </button>
              <button className="px-8 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                AI 解卦（开发中）
              </button>
            </div>
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
