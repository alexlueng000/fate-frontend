// Owned-source interface fixtures; these do not prove live model/MySQL behavior.
import { test, expect, type Page } from '@playwright/test';

const titles = ['个人画像', '性格特点', '做事方式', '人际与感情', '行动建议', '三年关键节点', '免责声明'];
const report = titles.map(title => `### ${title}\n这是${title}的首次完整内容。`).join('\n\n');
const chart = { gender: '男', solar_date: '1993-03-09 07:00:00', four_pillars: { year: ['甲', '子'], month: ['丙', '寅'], day: ['戊', '辰'], hour: ['庚', '午'] }, dayun: [{ age: 8, start_year: 2000, pillar: ['丁', '卯'] }] };
const context = { taskType: 'career', mode: 'bazi', title: '原事业背景', facts: { topic: '长期方向', currentSituation: '仍在原公司' } };
type State = 'idle' | 'pending' | 'retryable' | 'succeeded';

async function fixture(page: Page, initial: State, active = false) {
  let state = initial;
  let available = true;
  let starts = 0;
  let retries = 0;
  await page.addInitScript(active => {
    localStorage.removeItem('chat:active:bazi'); sessionStorage.removeItem('conversation_id');
    if (active) localStorage.setItem('chat:active:bazi', 'bazi_conv_9003');
  }, active);
  const status = () => ({ state, source_hash: 'a'.repeat(64), paipan: chart, task_context: context,
    ...(state === 'idle' ? {} : { conversation_id: 'bazi_conv_9003' }),
    ...(state === 'succeeded' ? { message_id: 2, reply: report } : {}) });
  await page.route('**/api/chat/start/status', route => route.fulfill(available ? { json: status() } : { status: 503, json: { detail: '状态服务暂不可用' } }));
  await page.route('**/api/chat/conversations/bazi_conv_9003/opening', route => {
    if (route.request().method() === 'POST') {
      retries++;
      expect(route.request().postDataJSON()).toEqual({});
      state = 'succeeded';
      return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: report, replace: true })}\n\ndata: {"meta":{"message_id":2}}\n\ndata: [DONE]\n\n` });
    }
    return route.fulfill(available ? { json: status() } : { status: 503, json: { detail: '状态服务暂不可用' } });
  });
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'bazi', title: '首次个人报告',
    profile: { bazi_chart: { mingpan: chart } }, task_context: context, messages: state === 'succeeded'
      ? [{ id: 1, role: 'user', content: '我的命盘信息如下：首次请求' }, { id: 2, role: 'assistant', content: report }] : [] } }));
  await page.route('**/api/chat/start', route => {
    starts++; state = 'pending';
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"未完成的首次报告","replace":true}\n\n' });
  });
  return { setState: (next: State) => { state = next; }, setAvailable: (next: boolean) => { available = next; },
    starts: () => starts, retries: () => retries };
}

test('a fresh second page waits for the owned first report and restores all seven chapters', async ({ page }, info) => {
  const server = await fixture(page, 'pending');
  await page.goto('/chat');
  await expect(page.getByText('这份报告仍在生成中', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '重试生成完整报告' })).toHaveCount(0);
  expect(server.starts()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/fate-bazi-first-report-wait-${info.project.name}.png`, fullPage: true });
  server.setState('succeeded');
  await page.getByRole('button', { name: '重新加载首次报告' }).click();
  for (const title of titles) await expect(page.getByText(`这是${title}的首次完整内容。`, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看完整报告' })).toHaveAttribute('href', '/reports/9003');
  await page.reload();
  await expect(page.getByText('这是个人画像的首次完整内容。', { exact: true })).toBeVisible();
  expect(server.starts()).toBe(0); expect(server.retries()).toBe(0);
});

test('a connection dropped before CID is checked on refresh without a second generation', async ({ page }) => {
  const server = await fixture(page, 'idle');
  await page.goto('/chat');
  await expect(page.getByRole('button', { name: '重新加载首次报告' })).toBeVisible();
  await expect(page.getByText('未完成的首次报告')).toHaveCount(0);
  expect(server.starts()).toBe(1);
  await page.reload();
  await expect(page.getByText('这份报告仍在生成中', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/conv_id=9003/);
  expect(server.starts()).toBe(1);
  server.setState('succeeded');
  await page.getByRole('button', { name: '重新加载首次报告' }).click();
  await expect(page.getByText('这是个人画像的首次完整内容。', { exact: true })).toBeVisible();
  expect(server.starts()).toBe(1);
});

test('failed opening is retried manually by its original conversation, never current profile', async ({ page }) => {
  const server = await fixture(page, 'retryable');
  await page.goto('/chat');
  await expect(page.getByRole('button', { name: '重试生成完整报告' })).toBeVisible();
  expect(server.starts()).toBe(0);
  await page.reload();
  await expect(page.getByRole('button', { name: '重试生成完整报告' })).toBeVisible();
  await page.getByRole('button', { name: '重试生成完整报告' }).click();
  await expect(page.getByText('这是个人画像的首次完整内容。', { exact: true })).toBeVisible();
  await expect(page.getByText('未完成的首次报告')).toHaveCount(0);
  expect(server.starts()).toBe(0); expect(server.retries()).toBe(1);
});

test('a saved report after a truncated stream is recovered by reading, without charging again', async ({ page }) => {
  const server = await fixture(page, 'idle');
  await page.route('**/api/chat/start', route => {
    server.setState('succeeded');
    return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: report, replace: true })}\n\n` });
  });
  await page.goto('/chat');
  await expect(page.getByText('报告保存状态暂未确认', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重新加载首次报告' }).click();
  await expect(page.getByText('这是个人画像的首次完整内容。', { exact: true })).toBeVisible();
  expect(server.retries()).toBe(0);
});

test('unavailable status blocks first generation and can recover by querying again', async ({ page }) => {
  const server = await fixture(page, 'pending'); server.setAvailable(false);
  await page.goto('/chat');
  await expect(page.getByText('状态服务暂不可用', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toBeDisabled();
  expect(server.starts()).toBe(0);
  server.setAvailable(true);
  await page.getByRole('button', { name: '重新加载首次报告' }).click();
  await expect(page.getByText('这份报告仍在生成中', { exact: true })).toBeVisible();
  expect(server.starts()).toBe(0);
});

test('an empty active conversation resumes its first report through its durable opening record', async ({ page }) => {
  const server = await fixture(page, 'pending', true);
  await page.goto('/chat');
  await expect(page.getByText('这份报告仍在生成中', { exact: true })).toBeVisible();
  await expect(page.getByText('这条记录暂时没有可显示的解读内容')).toHaveCount(0);
  server.setState('succeeded');
  await page.getByRole('button', { name: '重新加载首次报告' }).click();
  await expect(page.getByText('这是个人画像的首次完整内容。', { exact: true })).toBeVisible();
  expect(server.starts()).toBe(0);
});

test('bound guest entry checks that public source rather than an unrelated active conversation', async ({ page }) => {
  const server = await fixture(page, 'pending', true);
  await page.route('**/api/guest/analysis/owned-guest', route => route.fulfill({ json: { public_id: 'owned-guest', status: 'succeeded', bazi_result: { mingpan: chart } } }));
  let checked = 0;
  await page.route('**/api/chat/start/status', route => {
    expect(route.request().postDataJSON()).toEqual({ guest_analysis_public_id: 'owned-guest' }); checked++;
    return route.fulfill({ json: { state: 'pending', conversation_id: 'bazi_conv_9003', paipan: chart, task_context: context } });
  });
  await page.goto('/chat?guest_analysis_public_id=owned-guest');
  await expect(page.getByText('这份报告仍在生成中', { exact: true })).toBeVisible();
  expect(checked).toBe(1); expect(server.starts()).toBe(0);
  server.setState('succeeded');
  await page.getByRole('button', { name: '重新加载首次报告' }).click();
  await expect(page.getByText('这是个人画像的首次完整内容。', { exact: true })).toBeVisible();
});

test('stopping first generation removes the partial answer and refresh does not start again', async ({ page }) => {
  const server = await fixture(page, 'idle');
  let release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  await page.route('**/api/chat/start', async route => { calls++; server.setState('pending'); await held; await route.abort().catch(() => {}); });
  await page.goto('/chat');
  await page.getByRole('button', { name: '停止生成报告' }).click();
  release();
  await expect(page.getByRole('button', { name: '重新加载首次报告' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('这份报告仍在生成中', { exact: true })).toBeVisible();
  expect(calls).toBe(1);
});

test('first generation quota exhaustion keeps the purchase dialog and never archives an error', async ({ page }) => {
  const server = await fixture(page, 'idle');
  let calls = 0;
  await page.route('**/api/chat/start', route => {
    calls++;
    return route.fulfill({ status: 429, json: { detail: '八字次数已用完，请查看套餐。' } });
  });
  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: '八字次数已用完', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '前往充值', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).last().click();
  await expect(page.getByRole('button', { name: '重新加载首次报告' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: '重试生成完整报告' })).toBeVisible();
  expect(calls).toBe(1); expect(server.retries()).toBe(0);
});
