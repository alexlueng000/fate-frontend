'use client';

import { useState } from 'react';
import { emotionApi, CreateEmotionRecordRequest } from '@/app/lib/emotion/api';

interface DialogFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

const EMOTION_TAGS = [
  '焦虑', '平静', '喜悦', '悲伤', '愤怒', '恐惧',
  '兴奋', '疲惫', '孤独', '感恩', '困惑', '希望'
];

export default function DialogFlow({ onComplete, onCancel }: DialogFlowProps) {
  const [step, setStep] = useState(1);
  const [emotionScore, setEmotionScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入你的感受');
      return;
    }

    setLoading(true);
    try {
      const data: CreateEmotionRecordRequest = {
        emotion_score: emotionScore,
        emotion_tags: selectedTags.length > 0 ? selectedTags : undefined,
        content: content.trim()
      };

      await emotionApi.createRecord(data);
      onComplete();
    } catch (error) {
      console.error('Failed to create emotion record:', error);
      alert('记录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              此刻，你的感受如何？
            </h2>
            <p className="text-gray-600 text-center">
              用 1-10 分来表达你现在的情绪状态
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-sm text-gray-600">1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={emotionScore}
                  onChange={(e) => setEmotionScore(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-sm text-gray-600">10</span>
              </div>

              <div className="text-4xl font-bold text-amber-600">
                {emotionScore}
              </div>

              <div className="text-sm text-gray-500 text-center">
                {emotionScore <= 3 && '情绪较低，需要关注'}
                {emotionScore > 3 && emotionScore <= 6 && '情绪平稳'}
                {emotionScore > 6 && '情绪良好'}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={onCancel} className="btn-secondary px-6 py-2">
                取消
              </button>
              <button onClick={() => setStep(2)} className="btn-primary px-6 py-2">
                下一步
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              选择你的情绪标签
            </h2>
            <p className="text-gray-600 text-center">
              可以选择多个，也可以跳过
            </p>

            <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
              {EMOTION_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${selectedTags.includes(tag)
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setStep(1)} className="btn-secondary px-6 py-2">
                上一步
              </button>
              <button onClick={() => setStep(3)} className="btn-primary px-6 py-2">
                下一步
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              写下你的感受
            </h2>
            <p className="text-gray-600 text-center">
              不需要完美的文字，只需要真实的表达
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="此刻，我感到..."
              className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />

            <div className="text-sm text-gray-500 text-right">
              {content.length} 字
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setStep(2)} className="btn-secondary px-6 py-2">
                上一步
              </button>
              <button onClick={() => setStep(4)} className="btn-primary px-6 py-2">
                下一步
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              确认你的记录
            </h2>

            <div className="card p-6 space-y-4">
              <div>
                <span className="text-sm text-gray-600">情绪评分：</span>
                <span className="text-lg font-semibold text-amber-600 ml-2">
                  {emotionScore} 分
                </span>
              </div>

              {selectedTags.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">情绪标签：</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-600 block mb-2">记录内容：</span>
                <div className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                  {content}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setStep(3)} className="btn-secondary px-6 py-2">
                修改
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {loading ? '提交中...' : '完成记录'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
        {/* 进度指示器 */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`
                w-12 h-1 rounded-full transition-all
                ${s <= step ? 'bg-amber-500' : 'bg-gray-200'}
              `}
            />
          ))}
        </div>

        {renderStep()}
      </div>
    </div>
  );
}
