'use client';

import { useState } from 'react';
import { useUser } from '@/app/lib/auth';
import { liuyaoApi, PaipanRequest, HexagramDetail } from '@/app/lib/liuyao/api';

export default function LiuyaoPage() {
  const { user } = useUser();
  const [method, setMethod] = useState<'number' | 'coin' | 'time'>('number');
  const [question, setQuestion] = useState('');
  const [numbers, setNumbers] = useState<string[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HexagramDetail | null>(null);

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
            <div className={`h-2 flex-1 rounded ${isDong ? 'bg-red-500' : 'bg-gray-800'}`} />
          ) : (
            <div className="flex-1 flex gap-2">
              <div className={`h-2 flex-1 rounded ${isDong ? 'bg-red-500' : 'bg-gray-800'}`} />
              <div className={`h-2 flex-1 rounded ${isDong ? 'bg-red-500' : 'bg-gray-800'}`} />
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600 w-12">{line.dizhi || ''}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="max-w-4xl mx-auto p-4 pt-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">六爻玄机</h1>
          <p className="text-gray-600">传统六爻占卜，AI 智能解卦</p>
        </div>

        {!result ? (
          /* 起卦表单 */
          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 问事输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问事内容
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="请输入你想占卜的事情..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={!user}
                />
              </div>

              {/* 起卦方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  起卦方式
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setMethod('number')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      method === 'number'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500'
                    }`}
                  >
                    数字起卦
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('coin')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      method === 'coin'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500'
                    }`}
                  >
                    铜钱起卦
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('time')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      method === 'time'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500'
                    }`}
                  >
                    时间起卦
                  </button>
                </div>
              </div>

              {/* 数字输入 */}
              {method === 'number' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输入三个数字
                  </label>
                  <div className="flex gap-4">
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
                        placeholder={`数字${index + 1}`}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        min="1"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    提示：可以随意输入三个正整数
                  </p>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex justify-center">
                {user ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-12 py-3 text-lg disabled:opacity-50"
                  >
                    {loading ? '排盘中...' : '开始排盘'}
                  </button>
                ) : (
                  <div className="text-gray-500">请先登录以使用六爻功能</div>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* 卦象结果 */
          <div className="space-y-6">
            {/* 卦象信息 */}
            <div className="card p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {result.main_gua}
                </h2>
                {result.change_gua && (
                  <p className="text-gray-600">变卦：{result.change_gua}</p>
                )}
              </div>

              {/* 六爻图 */}
              {result.lines && result.lines.lines && (
                <div className="max-w-md mx-auto">
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
                className="btn-secondary px-6 py-2"
              >
                重新起卦
              </button>
              <button className="btn-primary px-6 py-2 opacity-50 cursor-not-allowed">
                AI 解卦（开发中）
              </button>
            </div>
          </div>
        )}

        {/* 功能说明 */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="card p-6">
              <div className="text-3xl mb-3">🔢</div>
              <h3 className="font-semibold text-gray-800 mb-2">数字起卦</h3>
              <p className="text-sm text-gray-600">输入三个数字快速起卦</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-3">🪙</div>
              <h3 className="font-semibold text-gray-800 mb-2">铜钱起卦</h3>
              <p className="text-sm text-gray-600">模拟传统摇卦方式</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-3">⏰</div>
              <h3 className="font-semibold text-gray-800 mb-2">时间起卦</h3>
              <p className="text-sm text-gray-600">根据当前时间自动起卦</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
