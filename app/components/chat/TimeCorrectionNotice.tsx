import type { TimeCorrectionInfo } from '@/app/lib/chat/types';

/** Only show metadata from the actual chart; do not infer settings for old records. */
export default function TimeCorrectionNotice({ info }: { info?: TimeCorrectionInfo | null }) {
  if (!info) return null;
  const warnings = Array.isArray(info.warnings)
    ? [...new Set(info.warnings.filter((text): text is string => typeof text === 'string' && Boolean(text.trim())))]
    : [];
  if (!warnings.length && info.time_correction_method === 'longitude_only') {
    warnings.push('仅应用经度修正，未计入均时差。');
  }
  if (!warnings.length) return null;
  return (
    <aside aria-label="排盘时间说明" className="my-3 border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-4 py-3 text-sm leading-6 text-[var(--color-text-secondary)]">
      <p className="font-medium text-[var(--color-text-primary)]">排盘时间说明</p>
      {warnings.map(text => <p key={text}>{text}</p>)}
    </aside>
  );
}
