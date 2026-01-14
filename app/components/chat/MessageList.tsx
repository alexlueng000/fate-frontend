// app/components/chat/MessageList.tsx
'use client';
import { Msg, normalizeMarkdown } from '@/app/lib/chat/types';
import { ComponentType } from 'react';

export function MessageList({
  scrollRef,
  messages,
  Markdown,
}: {
  scrollRef?: React.MutableRefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement | null>;
  messages: Msg[];
  Markdown: ComponentType<{ content: string }>;
}) {
  return (
    <div
      ref={scrollRef}
      className="h-[100vh] overflow-y-auto rounded-3xl border border-[rgba(142,129,116,0.15)] bg-gradient-to-b from-[#fffbf7] to-[#fff9f4] p-4 space-y-3"
    >
      {messages.map((m, i) => {
        const isAssistant = m.role === 'assistant';
        const isIntro = m.meta?.kind === 'intro';
        const content = normalizeMarkdown(m.content || '');

        return (
          <div key={i} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
            {isAssistant && (
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c93b3a] to-[#e45c5c] text-white text-sm font-bold shadow-sm">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                isAssistant
                  ? 'bg-white text-[#1a1816] border-l-4 border-[#c93b3a] rounded-bl-sm shadow-sm'
                  : 'bg-gradient-to-br from-[#c93b3a] to-[#e45c5c] text-white rounded-br-sm shadow-md'
              }`}
            >
              {isAssistant ? (
                isIntro ? (
                  <div className="border-l-4 border-[#C4A574] bg-[#fbf7f2] p-3 rounded-lg msg-md">
                    <Markdown content={content} />
                  </div>
                ) : (
                  <Markdown content={content} />
                )
              ) : (
                content
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
