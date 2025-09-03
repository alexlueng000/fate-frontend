// app/components/chat/MessageList.tsx
'use client';
import { Msg, normalizeMarkdown } from '@/app/lib/chat/types';

export function MessageList({
  scrollRef,
  messages,
  Markdown,
}: {
  scrollRef: React.RefObject<HTMLDivElement>;
  messages: Msg[];
  Markdown: (props: { content: string }) => JSX.Element;
}) {
  return (
    <div
      ref={scrollRef}
      className="h-[46vh] overflow-y-auto rounded-3xl border border-red-200 bg-white/90 p-4 space-y-3"
    >
      {messages.map((m, i) => {
        const isAssistant = m.role === 'assistant';
        const isIntro = m.meta?.kind === 'intro';
        const content = normalizeMarkdown(m.content || '');

        return (
          <div key={i} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
            {isAssistant && (
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-red-800 text-sm font-bold">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                isAssistant
                  ? 'bg-white text-neutral-900 border border-red-200 rounded-bl-sm'
                  : 'bg-red-600 text-white rounded-br-sm shadow-md shadow-red-600/25'
              }`}
            >
              {isAssistant ? (
                isIntro ? (
                  <div className="border-l-4 border-red-300 bg-red-50/70 p-3 rounded-lg">
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
