'use client';
import { Msg, Paipan } from '@/app/lib/chat/types';
import { ComponentType } from 'react';
import { Bot, User } from 'lucide-react';
import { MessageRating } from './MessageRating';
import { SimplifyButton } from './SimplifyButton';
import { SimplifyPanel } from './SimplifyPanel';
import { SuggestedQuestions } from './SuggestedQuestions';

export function MessageList({
  scrollRef,
  messages,
  Markdown,
  paipanData,
  onRated,
  onSimplify,
  onSimplifyToggle,
  onQuestionClick,
  loading,
}: {
  scrollRef?: React.MutableRefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement | null>;
  messages: Msg[];
  Markdown: ComponentType<{ content: string }>;
  paipanData?: Paipan;
  onRated?: (messageIndex: number, rating: { ratingType: 'up' | 'down'; reason?: string }) => void;
  onSimplify?: (index: number) => void;
  onSimplifyToggle?: (index: number) => void;
  onQuestionClick?: (question: string) => void;
  loading?: boolean;
}) {
  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
      >
        <div className="flex h-full min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center mx-auto mb-4 opacity-50">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <p className="text-[var(--color-text-muted)]">
              完成排盘后，AI 将为您解读命理
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 space-y-4"
    >
      {messages.map((m, i) => {
        const isAssistant = m.role === 'assistant';
        const isIntro = m.meta?.kind === 'intro';
        const content = m.content || '';

        return (
          <div key={i} className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
            {/* Avatar - 桌面端显示，移动端隐藏 */}
            <div className={`hidden sm:flex flex-shrink-0 w-8 h-8 rounded-lg items-center justify-center ${
              isAssistant
                ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)]'
                : 'bg-[var(--color-bg-hover)] border border-[var(--color-border)]'
            }`}>
              {isAssistant ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
              )}
            </div>

            {/* Message Bubble */}
            <div className="flex flex-col max-w-[95%] sm:max-w-[85%]">
              <div
                className={`rounded-xl px-4 py-3 ${
                  isAssistant
                    ? 'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                    : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white'
                } ${m.streaming ? 'animate-pulse' : ''}`}
              >
                {isAssistant ? (
                  isIntro ? (
                    <div className="border-l-2 border-[var(--color-gold)] pl-3">
                      <div className="msg-md">
                        <Markdown content={content} />
                      </div>
                    </div>
                  ) : (
                    <div className="msg-md">
                      <Markdown content={content} />
                    </div>
                  )
                ) : (
                  <p className="text-sm">{content}</p>
                )}
              </div>

              {/* 操作按钮行 - 仅在AI消息且非流式状态且非开场白时显示 */}
              {isAssistant && !m.streaming && !isIntro && (
                <div className="flex justify-end items-center gap-1 mt-1 flex-wrap">
                  <SimplifyButton
                    status={m.simplify?.status ?? 'idle'}
                    expanded={m.simplify?.expanded ?? false}
                    onRequest={() => onSimplify?.(i)}
                    onToggle={() => onSimplifyToggle?.(i)}
                  />
                  {m.meta?.messageId && (
                    <MessageRating
                      messageId={m.meta.messageId}
                      userRating={m.userRating}
                      paipanData={paipanData}
                      onRated={(rating) => onRated?.(i, rating)}
                    />
                  )}
                </div>
              )}

              {/* 白话版面板 */}
              {isAssistant && !isIntro && m.simplify && (
                <SimplifyPanel
                  status={m.simplify.status}
                  content={m.simplify.content}
                  expanded={m.simplify.expanded}
                  error={m.simplify.error}
                  Markdown={Markdown}
                />
              )}

              {/* 推荐问题 */}
              {isAssistant && !isIntro && !m.streaming && m.suggestedQuestions && onQuestionClick && (
                <SuggestedQuestions
                  questions={m.suggestedQuestions}
                  onQuestionClick={onQuestionClick}
                  loading={loading}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
