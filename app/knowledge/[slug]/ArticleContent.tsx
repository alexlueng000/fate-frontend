'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

type Props = { content: string };

export default function ArticleContent({ content }: Props) {
  return (
    <div className="prose-knowledge">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-bold text-[var(--color-text-primary)] mt-10 mb-4 pb-2 border-b border-[var(--color-border)]"
              style={{ fontFamily: 'var(--font-display)' }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-base font-bold text-[var(--color-primary)] mt-6 mb-3"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="text-[var(--color-text-secondary)] leading-relaxed my-4" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-3 ml-5 list-disc space-y-1 marker:text-[var(--color-gold)]" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-3 ml-5 list-decimal space-y-1 marker:text-[var(--color-primary)]" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-[var(--color-text-secondary)] leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-[var(--color-text-primary)]" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-[var(--color-gold)] pl-4 my-6 py-2 bg-[var(--color-bg-deep)] rounded-r-lg italic text-[var(--color-text-muted)]"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="bg-[var(--color-bg-deep)] border border-[var(--color-border)] px-4 py-2 text-left font-semibold text-[var(--color-text-primary)]"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-secondary)]"
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <pre className="overflow-x-auto rounded-lg bg-[var(--color-bg-deep)] p-4 my-4 text-sm">
                  <code {...props}>{children}</code>
                </pre>
              );
            }
            return (
              <code
                className="rounded bg-[var(--color-bg-deep)] px-1.5 py-0.5 text-[0.85em] text-[var(--color-primary)]"
                {...props}
              >
                {children}
              </code>
            );
          },
          hr: () => (
            <hr className="my-8 border-[var(--color-border)]" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
