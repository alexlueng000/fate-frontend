'use client';

import { Msg } from '@/app/lib/chat/types';

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
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-red-600 text-white rounded-br-sm shadow-md shadow-red-600/25'
                : 'bg-white text-neutral-900 border border-red-200 rounded-bl-sm'
            }`}
          >
            {m.role === 'assistant' ? <Markdown content={m.content} /> : m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
