import { splitReport } from '@/app/lib/report/sections';

/** Never reinterpret legacy prose or partial streamed headings as a structured answer. */
export function consultationSections(content: string) {
  const result = splitReport(content);
  const titles = ['核心观察', '分析依据', '现实建议'];
  if (result.sections.length !== titles.length ||
      !result.sections.every((section, i) => section.title === titles[i])) return null;
  return result;
}
