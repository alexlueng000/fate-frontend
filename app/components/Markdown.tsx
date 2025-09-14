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

// 统一的标题样式（防止任意断词，避免最后一个字掉行；黑色字体）
const headingBase =
  // 黑色 + 行高 + 关闭任意断词 + 保持 CJK 连贯 + 尽量均衡换行
  'text-black leading-snug break-keep whitespace-normal ' +
  '[overflow-wrap:normal] text-balance [text-wrap:balance]';

const components: Components = {
  // 标题：黑色 + 防“孤儿字”换行
  h1: ({ node, ...props }) => (
    <h1 className={`${headingBase} text-2xl font-bold my-3`} {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className={`${headingBase} text-xl font-semibold my-3`} {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className={`${headingBase} text-lg font-semibold my-2`} {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className={`${headingBase} text-base font-semibold my-2`} {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className={`${headingBase} text-base font-medium my-1`} {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className={`${headingBase} text-sm font-medium my-1`} {...props} />
  ),

  // 正文/列表：使用正常换词策略，避免全局 break-all 影响到中文
  p: ({ node, ...props }) => (
    <p className="break-words text-black" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="break-words text-black" {...props} />
  ),

  ul: ({ node, ...props }) => (
    <ul className="list-disc ml-5 text-black" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal ml-5 text-black" {...props} />
  ),

  a: ({ node, ...props }) => (
    <a
      className="text-black underline underline-offset-4"
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
          className="rounded bg-neutral-200 px-1 py-0.5 text-[13px] text-black"
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
      className="overflow-x-auto rounded-xl bg-neutral-100 p-3 text-[13px] text-black"
      {...props}
    />
  ),

  table: ({ node, ...props }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-black" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border-b border-black/10 px-3 py-2 text-left text-black" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-b border-black/10 px-3 py-2 text-black" {...props} />
  ),
};

export default function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div
      className="
        prose max-w-none text-black
        break-normal                 /* 兜底：关闭全局 break-all 之类 */
        prose-pre:rounded-xl prose-pre:bg-neutral-100 prose-pre:p-3
        prose-code:text-black prose-code:bg-neutral-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      "
    >
      <ReactMarkdown
        // 单个 \n 也渲染为 <br/>
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
        // 如果你不想让后端返回的 HTML 生效，打开这行：
        // skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
