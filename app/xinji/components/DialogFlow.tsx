'use client';
import { Button as UiButton, ChoiceInput as UiChoiceInput, Modal as UiModal, Textarea as UiTextarea } from '@/app/components/ui';


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
  const [error, setError] = useState<string | null>(null);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('请输入你的感受');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data: CreateEmotionRecordRequest = {
        emotion_score: emotionScore,
        emotion_tags: selectedTags.length > 0 ? selectedTags : undefined,
        content: content.trim()
      };

      await emotionApi.createRecord(data);
      onComplete();
    } catch (error: any) {
      console.error('Failed to create emotion record:', error);
      const errorMsg = error.message || '记录失败，请重试';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-wide">
                此刻，你的感受如何？
              </h2>
              <p className="text-[var(--color-text-secondary)] font-light text-lg">
                用数字来表达你现在的情绪状态
              </p>
            </div>

            <div className="flex flex-col items-center gap-8 py-8">
              {/* Score display with ink circle effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--color-bg-hover)] rounded-full blur-2xl opacity-30 scale-110" />
                <div className="relative w-32 h-32 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <span className="text-5xl font-serif text-[var(--color-text-primary)]">{emotionScore}</span>
                </div>
              </div>

              {/* Custom slider */}
              <div className="w-full max-w-md space-y-4">
                <div className="relative h-2 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-600 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
                    style={{ width: `${(emotionScore / 10) * 100}%` }}
                  />
                  <UiChoiceInput
                    type="range"
                    min="1"
                    max="10"
                    value={emotionScore}
                    onChange={(e) => setEmotionScore(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex justify-between text-sm text-[var(--color-text-muted)]0 font-light">
                  <span>低落</span>
                  <span>平稳</span>
                  <span>良好</span>
                </div>
              </div>

              {/* Emotion state description */}
              <div className="text-center min-h-[2rem]">
                <p className="text-[var(--color-text-secondary)] font-light italic">
                  {emotionScore <= 3 && '情绪较低，需要关注自己'}
                  {emotionScore > 3 && emotionScore <= 6 && '情绪平稳，保持觉察'}
                  {emotionScore > 6 && '情绪良好，值得记录'}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <UiButton variant="plain"
                onClick={onCancel}
                className="px-8 py-3 text-[var(--color-text-secondary)] font-light tracking-wide hover:text-[var(--color-text-primary)] transition-colors"
              >
                取消
              </UiButton>
              <UiButton variant="primary"
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-[var(--color-primary)] text-white font-light tracking-wide hover:bg-[var(--color-primary)] transition-all hover:tracking-wider"
              >
                继续
              </UiButton>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-wide">
                选择你的情绪
              </h2>
              <p className="text-[var(--color-text-secondary)] font-light text-lg">
                可以选择多个，也可以跳过
              </p>
            </div>

            {/* Organic tag layout */}
            <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto py-8">
              {EMOTION_TAGS.map((tag, index) => (
                <UiButton variant="plain"
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`
                    relative px-6 py-3 font-light tracking-wide transition-all duration-300
                    ${selectedTags.includes(tag)
                      ? 'bg-[var(--color-primary)] text-white shadow-lg scale-105'
                      : 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] hover:scale-105'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    borderRadius: `${20 + (index % 3) * 5}px ${25 + (index % 4) * 5}px ${22 + (index % 5) * 3}px ${18 + (index % 2) * 7}px`
                  }}
                >
                  {tag}
                </UiButton>
              ))}
            </div>

            {selectedTags.length > 0 && (
              <div className="text-center text-sm text-[var(--color-text-secondary)] font-light animate-fadeIn">
                已选择 {selectedTags.length} 个情绪
              </div>
            )}

            <div className="flex justify-center gap-4 pt-4">
              <UiButton variant="plain"
                onClick={() => setStep(1)}
                className="px-8 py-3 text-[var(--color-text-secondary)] font-light tracking-wide hover:text-[var(--color-text-primary)] transition-colors"
              >
                上一步
              </UiButton>
              <UiButton variant="primary"
                onClick={() => setStep(3)}
                className="px-8 py-3 bg-[var(--color-primary)] text-white font-light tracking-wide hover:bg-[var(--color-primary)] transition-all hover:tracking-wider"
              >
                继续
              </UiButton>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-wide">
                写下你的感受
              </h2>
              <p className="text-[var(--color-text-secondary)] font-light text-lg">
                不需要完美的文字，只需要真实的表达
              </p>
            </div>

            <div className="relative">
              {/* Decorative corners */}
              <div className="absolute -top-2 -left-2 w-16 h-16 border-l border-t border-[var(--color-border)]" />
              <div className="absolute -bottom-2 -right-2 w-16 h-16 border-r border-b border-[var(--color-border)]" />

              <UiTextarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="此刻，我感到..."
                className="w-full h-64 p-6 bg-white/80 backdrop-blur-sm border border-[var(--color-border)] resize-none focus:outline-none focus:border-[var(--color-border)] transition-colors font-light text-[var(--color-text-primary)] leading-relaxed text-lg"
                autoFocus
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-muted)]0 font-light">
                {content.length} 字
              </span>
              {content.length > 0 && (
                <span className="text-sm text-[var(--color-text-secondary)] font-light italic animate-fadeIn">
                  很好，继续写下去
                </span>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <UiButton variant="plain"
                onClick={() => setStep(2)}
                className="px-8 py-3 text-[var(--color-text-secondary)] font-light tracking-wide hover:text-[var(--color-text-primary)] transition-colors"
              >
                上一步
              </UiButton>
              <UiButton variant="primary"
                onClick={() => setStep(4)}
                className="px-8 py-3 bg-[var(--color-primary)] text-white font-light tracking-wide hover:bg-[var(--color-primary)] transition-all hover:tracking-wider"
              >
                继续
              </UiButton>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-wide">
                确认你的记录
              </h2>
              <p className="text-[var(--color-text-secondary)] font-light text-lg">
                这些将被妥善保存
              </p>
            </div>

            <div className="space-y-6 py-4">
              {/* Score summary */}
              <div className="flex items-center gap-4 pb-6 border-b border-[var(--color-border)]">
                <div className="w-16 h-16 rounded-full border border-[var(--color-border)] flex items-center justify-center bg-[var(--color-bg-card)]">
                  <span className="text-2xl font-serif text-[var(--color-text-primary)]">{emotionScore}</span>
                </div>
                <div>
                  <span className="text-sm text-[var(--color-text-muted)]0 font-light block">情绪评分</span>
                  <span className="text-[var(--color-text-primary)] font-light">
                    {emotionScore <= 3 && '较低状态'}
                    {emotionScore > 3 && emotionScore <= 6 && '平稳状态'}
                    {emotionScore > 6 && '良好状态'}
                  </span>
                </div>
              </div>

              {/* Tags summary */}
              {selectedTags.length > 0 && (
                <div className="pb-6 border-b border-[var(--color-border)]">
                  <span className="text-sm text-[var(--color-text-muted)]0 font-light block mb-3">情绪标签</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="px-4 py-2 bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] text-sm font-light"
                        style={{ borderRadius: '20px 25px 22px 18px' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content summary */}
              <div>
                <span className="text-sm text-[var(--color-text-muted)]0 font-light block mb-3">记录内容</span>
                <div className="relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-300 to-transparent" />
                  <div className="pl-6 text-[var(--color-text-primary)] font-light leading-relaxed whitespace-pre-wrap">
                    {content}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <UiButton variant="plain"
                onClick={() => setStep(3)}
                className="px-8 py-3 text-[var(--color-text-secondary)] font-light tracking-wide hover:text-[var(--color-text-primary)] transition-colors"
              >
                修改
              </UiButton>
              <UiButton variant="primary"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-[var(--color-primary)] text-white font-light tracking-wide hover:bg-[var(--color-primary)] transition-all hover:tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : '完成记录'}
              </UiButton>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center animate-fadeIn">
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <UiModal open bare onClose={onCancel} title="记录此刻的感受" size="xl" dismissible={!loading}>
      <div className="bg-[var(--color-bg)] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Decorative header */}
        <div className="relative h-2 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />

        <div className="p-12">
          {/* Progress indicator - ink dots */}
          <div className="flex justify-center gap-3 mb-12">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className="relative"
              >
                <div
                  className={`
                    w-3 h-3 rounded-full transition-all duration-500
                    ${s === step
                      ? 'bg-[var(--color-primary)] scale-125'
                      : s < step
                        ? 'bg-[var(--color-bg-hover)]'
                        : 'bg-[var(--color-bg-hover)]'
                    }
                  `}
                />
                {s < 4 && (
                  <div
                    className={`
                      absolute top-1/2 left-full w-8 h-[1px] transition-colors duration-500
                      ${s < step ? 'bg-[var(--color-bg-hover)]' : 'bg-[var(--color-bg-hover)]'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>

          {renderStep()}
        </div>

        {/* Decorative footer */}
        <div className="relative h-2 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </UiModal>
  );
}
