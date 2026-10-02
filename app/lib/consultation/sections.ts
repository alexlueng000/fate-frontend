import { splitReport } from '@/app/lib/report/sections';

/** Never reinterpret legacy prose or partial streamed headings as a structured answer. */
export function consultationSections(content: string) {
  const result = splitReport(content);
  const titles = [['核心观察', '核心判断'], ['分析依据'], ['现实建议', '行动建议']];
  if (result.sections.length !== titles.length ||
      !result.sections.every((section, i) => titles[i].includes(section.title) && section.body.trim())) return null;
  return result;
}
