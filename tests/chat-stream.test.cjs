const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(require.resolve('../app/lib/chat/sse.ts'), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } },
).outputText;

function setup(fetch, { mobile = false, reduced = false, fastTimeout = false } = {}) {
  const exports = {};
  const context = {
    exports, fetch, AbortController, TextDecoder,
    console: { log() {} },
    localStorage: { getItem: () => null },
    window: { matchMedia: query => ({ matches: query.includes('reduced') ? reduced : mobile }) },
    setTimeout: (fn, ms) => setTimeout(fn, fastTimeout && ms >= 90_000 ? 20 : ms),
    clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: fn => setTimeout(fn, 1),
    cancelAnimationFrame: clearTimeout,
  };
  vm.runInNewContext(source, context);
  return exports;
}

function response(text, crlf = false) {
  const data = `data: ${JSON.stringify({ text, replace: true })}\n\ndata: [DONE]\n\n`;
  return new Response(crlf ? data.replaceAll('\n', '\r\n') : data,
    { headers: { 'Content-Type': 'text/event-stream' } });
}

test('desktop delivers complete text and leaves no delayed updates', async () => {
  const { trySSE } = setup(async () => response('你好，世界'));
  const updates = [];
  await trySSE('/chat', {}, text => updates.push(text));
  assert.equal(updates.at(-1).trim(), '你好，世界');
  const count = updates.length;
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(updates.length, count);
});

test('mobile drains gradually without splitting emoji', async () => {
  const { trySSE } = setup(async () => response('你好😊，世界'), { mobile: true });
  const updates = [];
  await trySSE('/chat', {}, text => updates.push(text), undefined, { mobilePacing: true });
  assert.equal(updates[0], '你好😊');
  assert.equal(updates.at(-1).trim(), '你好😊，世界');
  assert.ok(updates.length > 1);
});

test('reduced motion bypasses mobile pacing', async () => {
  const { trySSE } = setup(async () => response('完整正文'), { mobile: true, reduced: true });
  const updates = [];
  await trySSE('/chat', {}, text => updates.push(text), undefined, { mobilePacing: true });
  assert.equal(updates[0].trim(), '完整正文');
});

test('CRLF events decode correctly', async () => {
  const { trySSE } = setup(async () => response('正文', true));
  let result;
  await trySSE('/chat', {}, text => { result = text; });
  assert.equal(result.trim(), '正文');
});

test('empty streams fail with actionable copy', async () => {
  const { trySSE, CHAT_FAILURE_MESSAGE } = setup(async () => response(''));
  await assert.rejects(trySSE('/chat', {}, () => {}), { message: CHAT_FAILURE_MESSAGE });
});

test('quota failures remain recognizable and issue one request', async () => {
  let calls = 0;
  const { trySSE, QuotaExhaustedError } = setup(async () => {
    calls++;
    return new Response(JSON.stringify({ detail: '配额已用完' }), { status: 429 });
  });
  await assert.rejects(trySSE('/chat', {}, () => {}), QuotaExhaustedError);
  assert.equal(calls, 1);
});

test('stalled requests abort instead of waiting forever', async () => {
  const { trySSE, CHAT_FAILURE_MESSAGE } = setup((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }), { fastTimeout: true });
  await assert.rejects(trySSE('/chat', {}, () => {}), { message: CHAT_FAILURE_MESSAGE });
});

test('abort during mobile drain stops further updates', async () => {
  const { trySSE } = setup(async () => response('很长的一段文字需要逐步显示'), { mobile: true });
  const controller = new AbortController();
  const updates = [];
  const pending = trySSE('/chat', {}, text => {
    updates.push(text);
    controller.abort();
  }, undefined, { mobilePacing: true, signal: controller.signal });
  await assert.rejects(pending, { name: 'AbortError' });
  const count = updates.length;
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(updates.length, count);
});
