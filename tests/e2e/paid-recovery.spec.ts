// Fixed API fixtures verify UI recovery; ownership and atomic charge are tested in the backend.
import { test, expect, type Page } from '@playwright/test';
const cid = 9001;
const question = '入职之前，我还应核实哪些条件？';
const reply = '核实后的完整回复。';
const original = '### 核心观察\n\n原报告的观察。\n\n### 分析依据\n\n原报告的依据。\n\n### 现实建议\n\n原报告的建议。';
const key = 'paid-recovery-key';
type Saved = { id: number; role: string; content: string };
type Attempt = { request_key: string; pass_id: number; message: string };
function state(status: string, attempt: Attempt = { request_key: key, pass_id: 1, message: question }, overrides = {}) {
  return { status, conversation_id: cid, ...attempt, reply: status === 'SUCCEEDED' ? reply : null,
    message_id: status === 'SUCCEEDED' ? 4 : null, baseline_message_id: 2, ...overrides };
}
async function setup(page: Page, data: { messages: Saved[]; used: boolean }) {
  await page.route('**/api/consultations/9001', route => route.fulfill({ json: { passes: [{ id: 1, order_id: 7,
    conversation_id: cid, status: 'ACTIVE', available: !data.used, remaining: data.used ? 0 : 1,
    reply_limit: 1, duration_hours: 24, expires_at: '2099-10-03T00:00:00Z' }] } }));
  await page.route('**/api/consultations/catalog/products', route => route.fulfill({ json: [] }));
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: cid, type: 'bazi', title: '原问题', messages: data.messages } }));
}
const base = () => ({ used: false, messages: [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }] });
function save(data: ReturnType<typeof base>, body: Attempt) {
  data.used = true;
  data.messages.push({ id: 3, role: 'user', content: body.message }, { id: 4, role: 'assistant', content: reply });
}
const input = (page: Page) => page.getByRole('textbox', { name: '对话输入框' });
const send = (page: Page) => page.getByRole('button', { name: '发送', exact: true });

for (const outcome of ['FAILED', 'MISSING']) {
  test(`paid: ${outcome} keeps the original draft after reload and uses the correct retry key`, async ({ page }) => {
    const data = base();
    const attempts: Attempt[] = [];
    await setup(page, data);
    await page.route('**/api/consultations/9001/request', route => route.fulfill({ json: { status: 'IDLE', conversation_id: cid } }));
    await page.route('**/api/consultations/9001/requests/*', route => attempts.length < 2
      ? route.fulfill(outcome === 'MISSING' ? { status: 404, json: {} } : { json: state('FAILED', attempts[0]) })
      : route.fulfill({ json: state('SUCCEEDED', attempts[1]) }));
    await page.route('**/api/consultations/9001/messages', route => {
      const body = route.request().postDataJSON() as Attempt;
      attempts.push(body);
      if (attempts.length === 1) return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"未完成的片段","replace":true}\n\n' });
      save(data, body);
      return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: reply, replace: true })}\n\ndata: [DONE]\n\n` });
    });
    await page.goto('/reading/9001');
    await input(page).fill(question);
    await send(page).click();
    await expect(page.getByText('回复保存状态需要确认')).toBeVisible();
    await expect(page.getByText('未完成的片段', { exact: true })).toHaveCount(0);
    await expect(page.getByText('原报告的观察。')).toBeVisible();
    await page.reload();
    await expect(input(page)).toHaveValue(question);
    await expect(send(page)).toBeDisabled();
    expect(attempts).toHaveLength(1);
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(send(page)).toBeEnabled();
    await send(page).click();
    await expect(page.getByText(reply, { exact: true })).toBeVisible();
    expect(attempts).toHaveLength(2);
    if (outcome === 'FAILED') expect(attempts[1].request_key).not.toBe(attempts[0].request_key);
    else expect(attempts[1].request_key).toBe(attempts[0].request_key);
    await expect(input(page)).toHaveValue('');
  });
}

test('paid: a committed reply survives disconnect and exhausted entitlement without another POST', async ({ page }) => {
  const data = base();
  let attempt: Attempt;
  let sends = 0;
  await setup(page, data);
  await page.route('**/api/consultations/9001/request', route => route.fulfill({ json: { status: 'IDLE', conversation_id: cid } }));
  await page.route('**/api/consultations/9001/requests/*', route => route.fulfill({ json: state('SUCCEEDED', attempt) }));
  await page.route('**/api/consultations/9001/messages', route => {
    sends++; attempt = route.request().postDataJSON(); save(data, attempt);
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"接收中断","replace":true}\n\n' });
  });
  await page.goto('/reading/9001');
  await input(page).fill(question); await send(page).click();
  await expect(page.getByText('回复保存状态需要确认')).toBeVisible();
  await page.reload();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByText('已读取到保存结果，无需重复发送。')).toBeVisible();
  await expect(input(page)).toHaveValue('');
  await expect(input(page)).toBeDisabled();
  expect(sends).toBe(1);
});

test('paid: fresh-page pending discovery preserves an edited next question while restoring the reply', async ({ page }) => {
  const data = base();
  let done = false;
  let sends = 0;
  await setup(page, data);
  await page.route('**/api/consultations/9001/request', route => route.fulfill({ json: done ? { status: 'IDLE', conversation_id: cid } : state('PENDING') }));
  await page.route('**/api/consultations/9001/requests/*', route => route.fulfill({ json: state(done ? 'SUCCEEDED' : 'PENDING') }));
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/consultations/9001/messages')) sends++; });
  await page.goto('/reading/9001');
  await expect(input(page)).toHaveValue(question);
  await expect(send(page)).toBeDisabled();
  await input(page).fill('我接下来想确认试用期安排。');
  data.messages.push({ id: 3, role: 'user', content: question }, { id: 4, role: 'assistant', content: reply });
  done = true;
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await expect(input(page)).toHaveValue('我接下来想确认试用期安排。');
  await expect(send(page)).toBeEnabled();
  expect(sends).toBe(0);
});

test('paid: discovery failure blocks sending until a successful read and preserves new text', async ({ page }) => {
  const data = base(); let available = false; let sends = 0;
  await setup(page, data);
  await page.route('**/api/consultations/9001/request', route => route.fulfill(available
    ? { json: { status: 'IDLE', conversation_id: cid } } : { status: 503, json: { detail: '未迁移' } }));
  page.on('request', request => { if (request.method() === 'POST') sends++; });
  await page.goto('/reading/9001');
  await expect(page.getByText('回复保存状态需要确认')).toBeVisible();
  await input(page).fill(question); await expect(send(page)).toBeDisabled();
  available = true; await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(send(page)).toBeEnabled(); await expect(input(page)).toHaveValue(question);
  expect(sends).toBe(0);
});

for (const damage of ['body', 'reply']) {
  test(`paid: ${damage} mismatch never confirms a saved answer or enables another charge`, async ({ page }) => {
    const data = base(); let done = false; let sends = 0;
    await setup(page, data);
    await page.route('**/api/consultations/9001/request', route => route.fulfill({ json: done ? { status: 'IDLE', conversation_id: cid } : state('PENDING') }));
    await page.route('**/api/consultations/9001/requests/*', route => route.fulfill({ json: state('SUCCEEDED', undefined,
      damage === 'body' ? { message: '不属于原请求的问题' } : {}) }));
    page.on('request', request => { if (request.method() === 'POST') sends++; });
    await page.goto('/reading/9001'); await expect(input(page)).toHaveValue(question);
    done = true;
    data.messages.push({ id: 3, role: 'user', content: question }, { id: 4, role: 'assistant', content: '正文不匹配的另一个回答' });
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByText(damage === 'body' ? '请求内容与原草稿不一致，请查看原对话。' : '请求已完成，但当前记录尚未包含对应回复，请稍后重新加载。')).toBeVisible();
    await expect(send(page)).toBeDisabled();
    await expect(page.getByText(reply, { exact: true })).toHaveCount(0);
    await expect(input(page)).toHaveValue(question); expect(sends).toBe(0);
  });
}

test('paid: expired remote request can only restart explicitly with a new key', async ({ page }) => {
  const data = base(); let attempt: Attempt | undefined;
  await setup(page, data);
  await page.route('**/api/consultations/9001/request', route => route.fulfill({ json: attempt ? { status: 'IDLE', conversation_id: cid } : state('EXPIRED') }));
  await page.route('**/api/consultations/9001/requests/*', route => route.fulfill({ json: state('SUCCEEDED', attempt) }));
  await page.route('**/api/consultations/9001/messages', route => {
    attempt = route.request().postDataJSON(); save(data, attempt!);
    return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: reply, replace: true })}\n\ndata: [DONE]\n\n` });
  });
  await page.goto('/reading/9001'); await expect(input(page)).toHaveValue(question);
  expect(attempt).toBeUndefined(); await send(page).click();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  expect(attempt!.request_key).not.toBe(key);
});

test('paid: another page’s pending request cannot replace a locally edited question', async ({ page }) => {
  const data = base(); let pending = true; let sends = 0;
  await page.addInitScript(() => sessionStorage.setItem('reading:pending:90001:9001', JSON.stringify({
    key: 'paid-local-draft', passId: 1, original: '本机原问题', question: '本机正在编辑的下一条问题', retry: 'new',
  })));
  await setup(page, data);
  await page.route('**/api/consultations/9001/request', route => route.fulfill({ json: pending ? state('PENDING') : { status: 'IDLE', conversation_id: cid } }));
  await page.route('**/api/consultations/9001/requests/*', route => route.fulfill({ json: state('FAILED', { request_key: 'paid-local-draft', pass_id: 1, message: '本机原问题' }) }));
  page.on('request', request => { if (request.method() === 'POST') sends++; });
  await page.goto('/reading/9001'); await expect(input(page)).toHaveValue('本机正在编辑的下一条问题');
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByText('另一个页面的解读仍在生成，当前草稿已保留，请稍后重新加载。')).toBeVisible();
  await expect(send(page)).toBeDisabled(); await expect(input(page)).toHaveValue('本机正在编辑的下一条问题');
  pending = false;
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(send(page)).toBeEnabled(); await expect(input(page)).toHaveValue('本机正在编辑的下一条问题');
  expect(sends).toBe(0);
});

test('paid: an old successful request without a reply pointer is never resent', async ({ page }) => {
  const data = base(); let sends = 0;
  save(data, { request_key: key, pass_id: 1, message: question });
  await page.addInitScript(({ key, question }) => sessionStorage.setItem('reading:pending:90001:9001', JSON.stringify({
    key, passId: 1, original: question, question, retry: 'none',
  })), { key, question });
  await setup(page, data);
  await page.route('**/api/consultations/9001/request', route => route.fulfill({ json: { status: 'IDLE', conversation_id: cid } }));
  await page.route('**/api/consultations/9001/requests/*', route => route.fulfill({ json: state('SUCCEEDED', undefined, { message_id: null, baseline_message_id: null }) }));
  page.on('request', request => { if (request.method() === 'POST') sends++; });
  await page.goto('/reading/9001'); await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByText('旧请求已标记完成，缺少回复定位；请核对原对话，不会重复发送这条问题。')).toBeVisible();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await expect(input(page)).toHaveValue(''); await expect(input(page)).toBeDisabled();
  expect(sends).toBe(0);
});
