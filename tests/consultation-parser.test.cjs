const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../app/lib/chat/parser.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsObject, require: () => ({ normalizeMarkdown: s => s }) });
const { parseSuggestedQuestions, restoreStoredMessage } = exportsObject;
test('optional recommendations do not invent unrelated fallback questions', () => {
  const parsed = parseSuggestedQuestions('先核对条件。\n---SUGGESTED_QUESTIONS---\n1. 我应先核对哪些条件？\n---END_SUGGESTED_QUESTIONS---');
  assert.equal(parsed.questions.length, 1);
  assert.equal(parsed.cleanedContent, '先核对条件。');
  assert.equal(parseSuggestedQuestions('没有推荐追问。').questions.length, 0);
});
test('reverse questions are removed and historical body stays intact', () => {
  const result = restoreStoredMessage({ id: 4, role: 'assistant', content: '原回复\n---SUGGESTED_QUESTIONS---\n你是否有明确 offer？\n---END_SUGGESTED_QUESTIONS---' });
  assert.equal(result.content, '原回复');
  assert.equal(result.suggestedQuestions, undefined);
});
