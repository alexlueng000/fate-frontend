'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

// 本地定义一个“像 CodeProps 一样”的类型，避免依赖内部私有路径
type CodePropsLike = React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  // node 等额外字段如果要用再加，这里先不强制
};

type MarkdownViewProps = {
  content: string;
};

const components: Components = {
  h1: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-indigo-300" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h3 className="text-lg font-semibold text-indigo-200" {...props} />
  ),
  ul: ({ node, ...props }) => <ul className="list-disc ml-5" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal ml-5" {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  // 关键：用我们自己的 CodePropsLike，TS 不再报 “inline 不存在” 的错
  code: (p: CodePropsLike) => {
    const { inline, className, children, ...props } = p;
    if (inline) {
      return (
        <code
          className="rounded bg-neutral-800 px-1 py-0.5 text-[13px] text-amber-300"
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
      className="overflow-x-auto rounded-xl bg-black/40 p-3 text-[13px]"
      {...props}
    />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border-b border-white/10 px-3 py-2 text-left" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-b border-white/10 px-3 py-2" {...props} />
  ),
};

export default function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="prose prose-invert max-w-none prose-pre:rounded-xl prose-pre:bg-black/40 prose-pre:p-3 prose-code:text-amber-300 prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}              // 表格/任务列表/删除线
        rehypePlugins={[rehypeRaw, rehypeHighlight]} // 受控 HTML + 语法高亮
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
