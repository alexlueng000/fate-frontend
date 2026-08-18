'use client';

import { useEffect, useState } from 'react';

const STAGES = [
  {
    title: '正在把命盘摊开看看',
    detail: '四柱已就位，容我仔细看两眼',
  },
  {
    title: '正在捋一捋盘里的线索',
    detail: '线索有点多，正在挑与你最相关的',
  },
  {
    title: '快好了，正在翻成大白话',
    detail: '最后润一润，让建议更好读',
  },
] as const;

export function WaitingResponse() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % STAGES.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  const stage = STAGES[stageIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${stage.title}。${stage.detail}`}
      className="relative min-h-[4.75rem] overflow-hidden py-1"
    >
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
          <span className="absolute h-4 w-4 animate-ping rounded-full border border-[var(--color-primary)] opacity-40 motion-reduce:animate-none" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
        </span>
        <span className="font-medium">{stage.title}</span>
        <span className="inline-flex items-end gap-1 text-[var(--color-primary)]" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className="h-1 w-1 animate-bounce rounded-full bg-current motion-reduce:animate-none"
              style={{ animationDelay: `${item * 160}ms` }}
            />
          ))}
        </span>
      </div>

      <p className="ml-8 mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
        {stage.detail}
      </p>

      <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-[var(--color-border)]" aria-hidden="true">
        <span className="block h-full w-1/3 animate-pulse bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent motion-reduce:animate-none" />
      </div>
    </div>
  );
}
