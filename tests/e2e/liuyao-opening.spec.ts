// First-generation recovery uses owned server reads; fixtures are not AI/SQL acceptance.
import { test, expect, type Page } from '@playwright/test';

const question = '是否接受已经收到的新工作 offer？';
const report = '### 核心判断\n\n先确认岗位职责和承诺的条件。\n\n### 分析依据\n\n这是固定测试依据。\n\n### 行动建议\n\n向招聘方索取书面岗位说明。';
const hexagram = { id: 7, hexagram_id: 'opening-fixture', question, gender: 'male', method: 'number', numbers: { numbers: [3, 5, 7] },
  main_gua: '乾', change_gua: '姤', shi_yao: 6, ying_yao: 3, lines: { lines: [] }, ganzhi: null,
  created_at: '2026-10-02T00:00:00Z', timestamp: '2026-10-02T00:00:00Z', location: '上海', solar_time: false };
const facts = { taskType: 'career', mode: 'liuyao', title: '是否接受 offer', facts: { topic: question, currentSituation: '收到书面 offer', options: '留任或入职' } };
const url = '/liuyao?hexagram_id=opening-fixture';

async function fixture(page: Page, state: () => string) {
  let starts = 0;
  await page.route('**/api/liuyao/opening-fixture', route => route.fulfill({ json: hexagram }));
  await page.route('**/api/liuyao/opening-fixture/chat/status', route => route.fulfill({ json: { state: state(),
    ...(state() !== 'idle' ? { conversation_id: 'liuyao_conv_9003' } : {}),
    ...(state() === 'succeeded' ? { message_id: 2, reply: report } : {}) } }));
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram,
    task_context: facts, messages: state() === 'succeeded' ? [{ id: 1, role: 'user', content: '请基于以下卦象做第一次解读' },
      { id: 2, role: 'assistant', content: report }] : [] } }));
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/liuyao/opening-fixture/chat/start')) starts++; });
  return () => starts;
}

test('another page’s pending opening survives refresh and recovers without a new generation', async ({ page }, info) => {
  let state = 'pending';
  const starts = await fixture(page, () => state);
  await page.goto(url);
  await expect(page.getByRole('button', { name: '解读正在生成…' })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: '解读正在生成…' })).toBeDisabled();
  state = 'succeeded';
  await page.getByRole('button', { name: '重新加载首次解读' }).click();
  await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
  await expect(page.getByRole('link', { name: '查看完整报告' })).toHaveAttribute('href', '/reports/9003');
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toBeVisible();
  expect(starts()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/fate-liuyao-opening-${info.project.name}.png`, fullPage: true });
});

test('a dropped opening stream before its conversation ID finds the committed report', async ({ page }) => {
  let state = 'idle';
  const starts = await fixture(page, () => state);
  await page.route('**/api/liuyao/opening-fixture/chat/start', route => {
    state = 'succeeded';
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"未确认的临时半截文字","replace":true}\n\n' });
  });
  await page.goto(url);
  await page.getByRole('button', { name: '开始 AI 解卦' }).click();
  await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
  await expect(page.getByText('未确认的临时半截文字')).toHaveCount(0);
  await expect(page.getByText('已读取到首次解读的保存结果，无需再次生成。')).toBeVisible();
  await page.reload();
  await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
  expect(starts()).toBe(1);
});

test('a failed opening permits a manual retry with the saved facts and removes partial text', async ({ page }) => {
  let state = 'retryable';
  const starts = await fixture(page, () => state);
  await page.route('**/api/liuyao/opening-fixture/chat/start', route => {
    expect(route.request().postDataJSON().task_context).toEqual(facts);
    if (starts() === 1) return route.fulfill({ contentType: 'text/event-stream',
      body: 'data: {"text":"失败的半截解读","replace":true}\n\ndata: {"error":"保存失败","status":500}\n\n' });
    state = 'succeeded';
    return route.fulfill({ contentType: 'text/event-stream', body: `data: {"meta":{"conversation_id":"liuyao_conv_9003"}}\n\ndata: ${JSON.stringify({ text: report, replace: true })}\n\ndata: {"meta":{"message_id":2}}\n\ndata: [DONE]\n\n` });
  });
  await page.goto(url);
  await page.getByRole('button', { name: '重试 AI 解卦' }).click();
  await expect(page.getByRole('button', { name: '重试 AI 解卦' })).toBeEnabled();
  await expect(page.getByText('失败的半截解读')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: '重试 AI 解卦' }).click();
  await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
  expect(starts()).toBe(2);
});

test('an unavailable status keeps generation disabled and never trusts a stale browser report', async ({ page }) => {
  let unavailable = true;
  const starts = await fixture(page, () => 'idle');
  await page.addInitScript(() => {
    localStorage.setItem('liuyao:active_conv:opening-fixture', 'liuyao_conv_777');
    localStorage.setItem('chat:conv:liuyao_conv_777', JSON.stringify([{ role: 'assistant', content: '另一账号的旧缓存回答' }]));
  });
  await page.route('**/api/liuyao/opening-fixture/chat/status', route => route.fulfill(unavailable ? { status: 503, json: { detail: 'unavailable' } } : { json: { state: 'idle' } }));
  await page.goto(url);
  await expect(page.getByRole('button', { name: '先检查保存结果' })).toBeDisabled();
  await expect(page.getByText('另一账号的旧缓存回答')).toHaveCount(0);
  unavailable = false;
  await page.getByRole('button', { name: '重新加载首次解读' }).click();
  await expect(page.getByRole('button', { name: '开始 AI 解卦' })).toBeEnabled();
  expect(starts()).toBe(0);
});

test('a pending first generation can refresh before receiving metadata and later reopen the saved result', async ({ page }) => {
  let state = 'idle';
  const starts = await fixture(page, () => state);
  let release: () => void = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/liuyao/opening-fixture/chat/start', async route => {
    state = 'pending';
    await held;
    await route.abort().catch(() => {});
  });
  try {
    await page.goto(url);
    await page.getByRole('button', { name: '开始 AI 解卦' }).click();
    await expect(page.getByRole('button', { name: '停止生成' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: '解读正在生成…' })).toBeDisabled();
    state = 'succeeded'; release();
    await page.getByRole('button', { name: '重新加载首次解读' }).click();
    await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
    expect(starts()).toBe(1);
  } finally { release(); }
});

test('a new cast writes its recovery URL before the first model request', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const starts = await fixture(page, () => 'idle');
  await page.route('**/api/liuyao/paipan', route => route.fulfill({ json: hexagram }));
  await page.goto('/liuyao');
  await page.getByLabel('所问之事').fill(question);
  await page.getByRole('button', { name: /一键起卦/ }).click();
  await page.getByRole('button', { name: '立即解卦', exact: true }).click();
  await expect(page).toHaveURL(/hexagram_id=opening-fixture/);
  await page.reload();
  await expect(page.getByRole('heading', { name: question, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始 AI 解卦' })).toBeEnabled();
  expect(starts()).toBe(0);
});
