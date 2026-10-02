'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/app/lib/api';

export function ReadingLink({ conversationId }: { conversationId?: string | number | null }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(api('/consultations/features'), { signal: controller.signal }).then(r => r.ok ? r.json() : null)
      .then(data => setEnabled(data?.enabled === true)).catch(() => {});
    return () => controller.abort();
  }, []);
  const id = String(conversationId ?? '').replace(/^(bazi_conv_|liuyao_conv_|conv_)/, '');
  if (!enabled || !/^\d+$/.test(id)) return null;
  return <Link href={`/reading/${id}`} className="inline-flex min-h-11 items-center text-sm text-[var(--color-primary)] underline underline-offset-4">单问题深度解读与权益</Link>;
}
