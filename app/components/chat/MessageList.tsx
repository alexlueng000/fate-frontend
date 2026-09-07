'use client';
import { Msg, Paipan } from '@/app/lib/chat/types';
import { ComponentType, ReactNode } from 'react';
import Image from 'next/image';
import { User, Loader2, RotateCcw } from 'lucide-react';
import { MessageRating } from './MessageRating';
import { SimplifyButton } from './SimplifyButton';
import { SimplifyPanel } from './SimplifyPanel';
import { SuggestedQuestions } from './SuggestedQuestions';
import { parseSuggestedQuestions } from '@/app/lib/chat/parser';
import { WaitingResponse } from './WaitingResponse';

export function MessageList({
  scrollRef,
  messages,
  Markdown,
  paipanData,
  onRated,
  onSimplify,
  onSimplifyToggle,
  onQuestionClick,
  onRegenerate,
  regenerating,
  loading,
  emptyText = '正在准备中…',
  emptyTitle,
  emptyDescription,
  emptyAction,
  containerClassName,
}: {
  scrollRef?: React.MutableRefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement | null>;
  messages: Msg[];
  Markdown: ComponentType<{ content: string }>;
  paipanData?: Paipan;
  onRated?: (messageIndex: number, rating: { ratingType: 'up' | 'down'; reason?: string }) => void;
  onSimplify?: (index: number) => void;
  onSimplifyToggle?: (index: number) => void;
  onQuestionClick?: (question: string) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  loading?: boolean;
  emptyText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  containerClassName?: string;
}) {
  const baseClass = containerClassName ?? 'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]';

  // Last assistant message that isn't the intro and isn't streaming — the only one we offer "regenerate" on.
  let lastRegenerableIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant' && !m.streaming && m.meta?.kind !== 'intro') {
      lastRegenerableIdx = i;
      break;
    }
  }
  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-6 ${baseClass}`}
      >
        <div className="flex h-full min-h-[300px] items-center justify-center">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm">
              <Image src="/images/yifan-assistant-avatar.webp" alt="一帆命理助手" width={56} height={56} className="h-full w-full object-cover" priority />
            </div>
            {emptyTitle && (
              <h2 className="text-[1.25rem] font-medium text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                {emptyTitle}
              </h2>
            )}
            <p className={`${emptyTitle ? 'mt-3' : ''} text-[0.9375rem] leading-[1.8] text-[var(--color-text-muted)]`}>
              {emptyDescription ?? emptyText}
            </p>
            {emptyAction && <div className="mt-5">{emptyAction}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto px-3 py-4 space-y-4 ${baseClass}`}
    >
      {messages.map((m, i) => {
        const isAssistant = m.role === 'assistant';
        const isIntro = m.meta?.kind === 'intro';
        const content = m.content || '';
        // Render-time parsing is intentional. It prevents protocol markers from
        // leaking when an SSE completion update races with React state, and also
        // repairs cached messages created before suggestedQuestions was stored.
        const parsed = isAssistant && !isIntro
          ? parseSuggestedQuestions(content)
          : { questions: [], cleanedContent: content };
        const displayContent = parsed.cleanedContent;
        const suggestedQuestions = m.suggestedQuestions?.length
          ? m.suggestedQuestions
          : parsed.questions;

        return (
          <div key={i} className={`flex gap-2 sm:gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
            {/* Avatar - 桌面端显示，移动端隐藏 */}
            <div className={`hidden sm:flex flex-shrink-0 w-8 h-8 overflow-hidden rounded-lg items-center justify-center ${
              isAssistant
                ? 'bg-[#fff8ee] border border-[var(--color-border)] shadow-sm'
                : 'bg-[var(--color-bg-hover)] border border-[var(--color-border)]'
            }`}>
              {isAssistant ? (
                <Image src="/images/yifan-assistant-avatar.webp" alt="一帆命理助手" width={32} height={32} className="h-full w-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
              )}
            </div>

            {/* Message Bubble */}
            <div className="flex flex-col min-w-0 flex-1">
              <div
                className={`rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 ${
                  isAssistant
                    ? 'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-primary)] text-white max-w-[85%] sm:max-w-[75%] ml-auto'
                }`}
              >
                {isAssistant ? (
                  m.streaming && !displayContent.trim() ? (
                    <WaitingResponse />
                  ) : isIntro ? (
                    <div className="border-l-2 border-[var(--color-gold)] pl-3">
                      <div className="msg-md">
                        <Markdown content={displayContent} />
                      </div>
                    </div>
                  ) : (
                    <div className="msg-md">
                      <Markdown content={displayContent} />
                    </div>
                  )
                ) : (
                  <p className="text-sm">{content}</p>
                )}
              </div>

              {/* 操作按钮行 - 仅在AI消息且非流式状态且非开场白时显示 */}
              {isAssistant && !m.streaming && !isIntro && (
                <div className="flex justify-end items-center gap-1 mt-1 flex-wrap">
                  {onRegenerate && i === lastRegenerableIdx && (
                    <button
                      type="button"
                      onClick={onRegenerate}
                      disabled={loading || regenerating}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
                      title={regenerating ? '正在重新解读' : '重新解读这条回复'}
                      aria-label={regenerating ? '正在重新解读' : '重新解读这条回复'}
                    >
                      {regenerating
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>{regenerating ? '重新解读中…' : '重新解读'}</span>
                    </button>
                  )}
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
              {isAssistant && !isIntro && !m.streaming && suggestedQuestions.length > 0 && onQuestionClick && (
                <SuggestedQuestions
                  questions={suggestedQuestions}
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
