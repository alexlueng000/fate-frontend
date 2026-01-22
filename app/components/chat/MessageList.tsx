'use client';
import { Msg } from '@/app/lib/chat/types';
import { ComponentType } from 'react';
import { Bot, User } from 'lucide-react';

export function MessageList({
  scrollRef,
  messages,
  Markdown,
}: {
  scrollRef?: React.MutableRefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement | null>;
  messages: Msg[];
  Markdown: ComponentType<{ content: string }>;
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
            <div
              className={`max-w-[95%] sm:max-w-[85%] rounded-xl px-4 py-3 ${
                isAssistant
                  ? 'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                  : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white'
              } ${m.streaming ? 'animate-pulse' : ''}`}
            >
              {isAssistant ? (
                isIntro ? (
                  <div className="border-l-2 border-[var(--color-gold)] pl-3">
                    <Markdown content={content} />
                  </div>
                ) : (
                  <Markdown content={content} />
                )
              ) : (
                <p className="text-sm">{content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
