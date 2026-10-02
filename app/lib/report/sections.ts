import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

export const REPORT_TITLES = ['个人画像', '性格特点', '做事方式', '人际与感情', '行动建议', '三年关键节点', '免责声明'] as const;
export type ReportSection = { id: string; title: string; source: string; body: string; years: { title: string; source: string }[]; introduction: string };

/** Root AST headings only: fenced code and quoted/list headings remain content. */
export function splitReport(source: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source);
  const headings = tree.children.filter(node => node.type === 'heading' && node.depth === 3);
  const text = (node: unknown): string => {
    const value = node as { value?: string; children?: unknown[] };
    return value.value ?? value.children?.map(text).join('') ?? '';
  };
  const definitions = tree.children.filter(node => node.type === 'definition')
    .map(node => source.slice(node.position!.start.offset!, node.position!.end.offset!)).join('\n');
  const sections: ReportSection[] = headings.map((heading, index) => {
    const start = heading.position!.start.offset!;
    const end = headings[index + 1]?.position?.start.offset ?? source.length;
    const bodyStart = heading.position!.end.offset!;
    const years = tree.children.filter(node => node.type === 'heading' && node.depth === 4
      && node.position!.start.offset! >= bodyStart && node.position!.start.offset! < end);
    return {
      id: `report-section-${index}`, title: text(heading).replace(/\u2060/g, '').trim(), source: source.slice(start, end), body: source.slice(bodyStart, end),
      introduction: source.slice(bodyStart, years[0]?.position?.start.offset ?? end),
      years: years.map((year, i) => ({ title: text(year), source: source.slice(year.position!.end.offset!, years[i + 1]?.position?.start.offset ?? end) })),
    };
  });
  return {
    sections, definitions,
    preamble: source.slice(0, headings[0]?.position?.start.offset ?? source.length),
    standard: sections.length === REPORT_TITLES.length && sections.every((section, i) => section.title === REPORT_TITLES[i]),
  };
}
