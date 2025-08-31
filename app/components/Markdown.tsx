'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-pre:rounded-xl prose-pre:bg-black/40 prose-pre:p-3 prose-code:text-amber-300 prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
      <ReactMarkdown
        // GFM: 表格、任务列表、删除线等
        remarkPlugins={[remarkGfm]}
        // 允许受控内联 HTML（你若不信任后端内容，可移除它）
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        // 自定义一些元素样式，贴合你现有的 UI
        components={{
          h1: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-300" {...props} />,
          h2: ({node, ...props}) => <h3 className="text-lg font-semibold text-indigo-200" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc ml-5" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal ml-5" {...props} />,
          a:  ({node, ...props}) => <a className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200" target="_blank" rel="noreferrer" {...props} />,
          code: ({inline, className, children, ...props}) =>
            inline ? (
              <code className="rounded bg-neutral-800 px-1 py-0.5 text-[13px] text-amber-300" {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>{children}</code>
            ),
          pre: ({node, ...props}) => (
            <pre className="overflow-x-auto rounded-xl bg-black/40 p-3 text-[13px]" {...props} />
          ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse" {...props} />
            </div>
          ),
          th: ({node, ...props}) => <th className="border-b border-white/10 px-3 py-2 text-left" {...props} />,
          td: ({node, ...props}) => <td className="border-b border-white/10 px-3 py-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
