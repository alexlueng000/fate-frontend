'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

type CodePropsLike = React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type MarkdownViewProps = {
  content: string;
};

const components: Components = {
  h1: ({ node, ...props }) => (
    <h1 className="text-xl font-bold mt-4 mb-3 text-[var(--color-text-primary)]" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-lg font-bold mt-3 mb-2 text-[var(--color-text-primary)]" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-base font-bold mt-3 mb-2 text-[var(--color-text-primary)]" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-sm font-bold mt-2 mb-1 text-[var(--color-text-primary)]" {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className="text-base font-medium my-1" {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className="text-sm font-medium my-1" {...props} />
  ),

  p: ({ node, ...props }) => (
    <p className="break-words text-justify hyphens-none" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="break-words" {...props} />
  ),

  ul: ({ node, ...props }) => (
    <ul className="list-disc ml-5" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal ml-5" {...props} />
  ),

  a: ({ node, ...props }) => (
    <a
      className="underline underline-offset-4"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),

  code: (p: CodePropsLike) => {
    const { inline, className, children, ...props } = p;
    if (inline) {
      return (
        <code
          className="rounded bg-neutral-200 px-1 py-0.5 text-[13px]"
          {...props}
        >
          {children}
        </code>
      );
    }
    const langMatch = /language-(\w+)/.exec(className || '');
    return (
      <code className={className} data-language={langMatch?.[1]} {...props}>
        {children}
      </code>
    );
  },

  pre: ({ node, ...props }) => (
    <pre
      className="overflow-x-auto rounded-xl bg-neutral-100 p-3 text-[13px]"
      {...props}
    />
  ),

  table: ({ node, ...props }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border-b border-black/10 px-3 py-2 text-left" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-b border-black/10 px-3 py-2" {...props} />
  ),
};

export default function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
