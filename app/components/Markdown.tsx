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
    <h1 className="text-xl font-bold mt-4 mb-3 text-[var(--color-text-primary)]" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }} {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-lg font-bold mt-3 mb-2 text-[var(--color-text-primary)]" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }} {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-base font-bold mt-3 mb-2 text-[#D4380D] font-[var(--font-display)] pb-1" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }} {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-sm font-bold mt-2 mb-1 text-[#D4380D] font-[var(--font-display)]" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }} {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className="text-base font-medium my-1" {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className="text-sm font-medium my-1" {...props} />
  ),

  p: ({ node, ...props }) => (
    <p className="my-2 break-words text-justify text-[#1A1A1A] leading-relaxed" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="my-1 break-words pl-1" {...props} />
  ),

  ul: ({ node, ...props }) => (
    <ul className="my-2 ml-5 list-disc marker:text-[#D4380D]" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="my-2 ml-5 list-decimal marker:text-[#D4380D]" {...props} />
  ),

  a: ({ node, ...props }) => (
    <a
      className="underline underline-offset-4 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),

  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-[#D4380D]" {...props} />
  ),

  code: (p: CodePropsLike) => {
    const { inline, className, children, ...props } = p;
    if (inline) {
      return (
        <code
          className="rounded bg-[var(--color-bg-deep)] px-1.5 py-0.5 text-[0.85em] font-[var(--font-mono)]"
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
      className="overflow-x-auto rounded-lg bg-[var(--color-bg-deep)] p-3 text-[13px]"
      {...props}
    />
  ),

  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-3 border-[#D4380D] pl-4 my-3 text-[#4A4A4A] italic bg-[rgba(212,56,13,0.05)] py-2 rounded-r"
      {...props}
    />
  ),

  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-collapse" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border-b border-black/10 px-3 py-2 text-left font-semibold" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-b border-black/10 px-3 py-2" {...props} />
  ),
};

export default function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="msg-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
