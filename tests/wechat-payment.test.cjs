const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup({ wechat = true, response = { url: 'https://open.weixin.qq.com/authorize', state: 'nonce', ticket: 'ticket' } } = {}) {
  const storage = new Map();
  const calls = [];
  const effects = [];
  const listeners = new Map();
  const window = {
    location: { origin: 'https://fateinsight.site', pathname: '/membership', href: 'https://fateinsight.site/membership', assign: (url) => calls.push(['redirect', url]) },
    history: { state: null, replaceState: (_, __, url) => { window.location.href = url; } },
  };
  const api = {
    api: (path) => path, authHeaders: () => ({ Authorization: 'Bearer login' }),
    postJSON: async (...args) => { calls.push(['post', ...args]); return response; },
    createWeChatNativeCheckout: async (code) => { calls.push(['native', code]); return { code_url: 'qr' }; },
  };
  const source = ts.transpileModule(fs.readFileSync('app/lib/wechat-payment.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {}, require: (name) => name === 'react' ? { useEffect: (fn) => effects.push(fn) } : api,
    window, navigator: { userAgent: wechat ? 'MicroMessenger' : 'Chrome' },
    sessionStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    document: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) },
    URL, setTimeout, clearTimeout,
  };
  vm.runInNewContext(source, context);
  return { ...context.exports, window, storage, calls, effects, listeners };
}

test('WeChat starts OAuth without creating a Native order', async () => {
  const app = setup();
  assert.equal(await app.startWeChatCheckout('PLAN'), null);
  assert.equal(app.calls[0][1], '/payments/wechat/jsapi/authorize');
  assert.equal(app.calls[0][2].redirect_uri, 'https://fateinsight.site/membership');
  assert.ok(app.storage.has('wechat_payment_oauth'));
  assert.equal(app.calls[1][0], 'redirect');
});

test('outside WeChat preserves Native checkout', async () => {
  const app = setup({ wechat: false });
  assert.equal((await app.startWeChatCheckout('PLAN')).code_url, 'qr');
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0][0], 'native');
});

test('OAuth callback is consumed once even if effect runs twice', async () => {
  const app = setup({ response: { order: { id: 3 } } });
  app.storage.set('wechat_payment_oauth', JSON.stringify({ state: 'nonce', ticket: 'ticket' }));
  app.window.location.href += '?code=code&state=nonce';
  let checkout;
  app.useWeChatPaymentReturn((result) => { checkout = result; }, assert.fail);
  app.effects[0]();
  app.effects[0]();
  await new Promise(setImmediate);
  assert.equal(app.calls.length, 1);
  assert.equal(checkout.order.id, 3);
  assert.equal(new URL(app.window.location.href).search, '');
});

test('mismatched OAuth state never sends a checkout request', () => {
  const app = setup();
  app.storage.set('wechat_payment_oauth', JSON.stringify({ state: 'expected', ticket: 'ticket' }));
  app.window.location.href += '?code=code&state=wrong';
  let error;
  app.useWeChatPaymentReturn(assert.fail, (value) => { error = value; });
  app.effects[0]();
  assert.match(error, /授权失败/);
  assert.equal(app.calls.length, 0);
});

test('Bridge readiness and cancellation are handled without claiming payment success', async () => {
  const app = setup();
  const promise = app.invokeWeChatPay({ package: 'prepay_id=one' });
  app.window.WeixinJSBridge = { invoke: (method, params, callback) => {
    assert.equal(method, 'getBrandWCPayRequest');
    assert.equal(params.package, 'prepay_id=one');
    callback({ err_msg: 'get_brand_wcpay_request:cancel' });
  } };
  app.listeners.get('WeixinJSBridgeReady')();
  assert.equal(await promise, 'cancel');
  assert.equal(app.listeners.size, 0);
});
