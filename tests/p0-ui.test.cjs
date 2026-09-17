const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(relativePath, env = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  }});
  const scope = { exports: {}, require, process: { env } };
  vm.runInNewContext(outputText, scope);
  return scope.exports;
}
const Notice = load('app/components/chat/TimeCorrectionNotice.tsx').default;
const render = info => renderToStaticMarkup(React.createElement(Notice, { info }));

test('old charts and explicitly uncorrected charts do not invent warnings', () => {
  assert.equal(render(null), '');
  assert.equal(render({}), '');
  assert.equal(render({ time_correction_method: 'none', warnings: [] }), '');
});
test('geocoding fallback is visible and duplicate warnings appear once', () => {
  const warning = '出生地解析失败，未应用经度修正，保留当地钟表时间';
  const html = render({ time_correction_method: 'none', warnings: [warning, warning, '', null] });
  assert.ok(html.includes('排盘时间说明'));
  assert.equal(html.split(warning).length - 1, 1);
});
test('longitude-only charts state the missing equation of time', () => {
  assert.ok(render({ time_correction_method: 'longitude_only' }).includes('未计入均时差'));
});
test('server warning text is escaped instead of interpreted as HTML', () => {
  assert.ok(!render({ warnings: ['<script>unsafe</script>'] }).includes('<script>'));
});
test('production and normal development never enable the demo account', () => {
  for (const [mode, flag, expected] of [['production','1',false], ['development','0',false], ['development','1',true]]) {
    const config = load('app/lib/local-preview/config.ts', { NODE_ENV: mode, NEXT_PUBLIC_LOCAL_PREVIEW: flag });
    assert.equal(config.LOCAL_PREVIEW, expected);
  }
});
