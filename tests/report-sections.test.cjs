const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const loaded = (async () => {
  const modules = { unified: await import('unified'), 'remark-parse': await import('remark-parse'), 'remark-gfm': await import('remark-gfm') };
  const code = ts.transpileModule(fs.readFileSync('app/lib/report/sections.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS } }).outputText;
  const scope = { exports: {}, require: name => modules[name] };
  vm.runInNewContext(code, scope);
  return scope.exports;
})();
for (const [label, input, count] of [
  ['plain legacy report', '旧报告没有标题，正文必须完整保留。', 0],
  ['code and blockquotes', '开头\n```md\n### 假标题\n```\n> ### 引用标题\n\n### 正文\n内容', 1],
  ['duplicate and unknown headings', '### 性格特点\n甲\n### 性格特点\n乙\n### 未知章节\n丙', 3],
  ['unfinished heading', '### 个人画像\n内容\n###', 2],
  ['years', '### 三年关键节点\n引言\n#### 2030年·示例\n第一段\n#### 2031年·示例\n第二段', 1],
  ['references and table', '### 个人画像\n[依据][a]\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n[a]: https://example.com', 1],
]) {
  test(label + ': exact original content survives segmentation', async () => {
    const { splitReport } = await loaded;
    const result = splitReport(input);
    assert.equal(result.sections.length, count);
    assert.equal(result.preamble + result.sections.map(s => s.source).join(''), input);
    assert.equal(new Set(result.sections.map(s => s.id)).size, count);
  });
}
test('standard order and renamed headings are distinguished', async () => {
  const { splitReport, REPORT_TITLES } = await loaded;
  const text = REPORT_TITLES.map(title => `### ${title}\n\n正文`).join('\n');
  assert.equal(splitReport(text).standard, true);
  assert.equal(splitReport(text.replace('人际与感情', '感情与人际')).standard, false);
});
test('year content and link definitions stay available', async () => {
  const { splitReport } = await loaded;
  const result = splitReport('### 三年关键节点\n前言\n#### 2030年\n内容\n\n[a]: https://example.com');
  const section = result.sections[0];
  assert.equal(section.years[0].title, '2030年');
  assert.equal(section.introduction + '\n#### 2030年'.trimStart() + section.years[0].source, section.body);
  assert.ok(result.definitions.includes('[a]: https://example.com'));
});

test('legacy normalized headings retain source and recognize all seven chapters', async () => {
  const { splitReport, REPORT_TITLES } = await loaded;
  const text = REPORT_TITLES.map(title => `### ${title}\u2060\n完整的报告正文。`).join('\n');
  const report = splitReport(text);
  assert.equal(report.standard, true);
  assert.deepEqual(Array.from(report.sections, section => section.title), Array.from(REPORT_TITLES));
  assert.equal(report.preamble + report.sections.map(section => section.source).join(''), text);
});
