import { test, expect } from '@playwright/test';

test('career question, clarification and accessible drawer', async ({ page }, info) => {
  await page.goto('/career');
  await expect(page.getByRole('heading', { name: /最近，工作上的什么事/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '继续', exact: true })).toBeDisabled();
  await page.getByLabel('你的问题').fill('收到一个新 offer，我该考虑哪些条件？');
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await page.getByRole('radio', { name: /讨论具体选择/ }).check();
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await expect(page.locator('#career-error')).toContainText('具体机会或选项');
  await page.getByLabel('具体机会或选项').fill('留在现岗位，或接受新 offer');
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await expect(page.getByRole('heading', { name: '从这个问题开始。' })).toBeVisible();
  await page.getByRole('button', { name: '了解解读流程' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '关闭面板' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/fate-stage-${info.project.name}-career.png`, fullPage: true });
});

test('new career context reaches its own chat and streams a reply', async ({ page }) => {
  await page.goto('/career');
  await page.getByLabel('你的问题').fill('我想找到更适合自己的职业方向');
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await page.getByLabel('当前处境').fill('工作稳定但成长有限');
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await page.getByRole('button', { name: '开始事业解读' }).click();
  await expect(page).toHaveURL(/\/panel\?task=career/);
  await expect(page.getByText('长期事业方向：我想找到更适合自己的职业方向').first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toBeVisible();
  await expect(page.getByText('这是一段固定回复', { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: '停止', exact: true })).toHaveCount(0, { timeout: 30_000 });
});

test('reading pass: IME, durable reply, evidence and exhausted history', async ({ page }, info) => {
  const messages = [{ id: 1, role: 'user', content: '是否接受 offer？', created_at: '2026-10-02T00:00:00Z' }];
  let used = 0;
  let sends = 0;
  await page.route('**/api/consultations/9001', route => route.fulfill({ json: { passes: [{ id: 1, order_id: 7, conversation_id: 9001, status: 'ACTIVE', available: used === 0, remaining: 1 - used, reply_limit: 1, duration_hours: 24, expires_at: '2099-10-03T00:00:00Z' }] } }));
  await page.route('**/api/consultations/catalog/products', route => route.fulfill({ json: [{ code: 'TEST_ONLY', name: '单问题解读（测试）', price_cents: 990, duration_hours: 24, reply_limit: 3 }] }));
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: '是否接受 offer？', messages } }));
  await page.route('**/api/consultations/9001/messages', async route => {
    sends += 1;
    const question = route.request().postDataJSON().message;
    const reply = '### 核心观察\n\n先确认岗位职责。\n\n### 分析依据\n\n这里是可折叠的测试依据。\n\n### 现实建议\n\n向招聘方索取书面说明。';
    messages.push({ id: 2, role: 'user', content: question, created_at: '2026-10-02T00:00:00Z' }, { id: 3, role: 'assistant', content: reply, created_at: '2026-10-02T00:00:00Z' });
    used = 1;
    await route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: reply, replace: true })}\n\ndata: [DONE]\n\n` });
  });
  await page.goto('/reading/9001');
  await expect(page.getByText(/剩余 1 次成功回复/)).toBeVisible();
  const input = page.getByRole('textbox', { name: '对话输入框' });
  await input.fill('还需要核对什么？');
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, keyCode: 229 });
  expect(sends).toBe(0);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByText('先确认岗位职责。')).toBeVisible();
  await expect(page.getByText('这里是可折叠的测试依据。')).toBeHidden();
  await page.getByRole('button', { name: '查看分析依据' }).click();
  await expect(page.getByText('这里是可折叠的测试依据。')).toBeVisible();
  await expect(input).toBeDisabled();
  expect(sends).toBe(1);
  await page.reload();
  await expect(page.getByText('先确认岗位职责。')).toBeVisible();
  await page.getByRole('button', { name: '查看权益与购买' }).click();
  await expect(page.getByText('¥9.90', { exact: true })).toBeVisible();
  await expect(page.getByText(/支付成功起 24 小时/)).toBeVisible();
  await expect(page.getByRole('link', { name: '返回普通对话，使用原有次数' })).toHaveAttribute('href', '/chat?conv_id=9001');
  await page.getByRole('button', { name: '关闭面板' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByText('先确认岗位职责。').evaluate(node => node.scrollIntoView({ block: 'center' }));
  await expect(page.getByText('先确认岗位职责。')).toBeInViewport();
  await page.screenshot({ path: `/private/tmp/fate-stage-${info.project.name}-reading.png`, fullPage: true });
});

test('main conversation has a visible career entry and a compact soft layout', async ({ page }, info) => {
  await page.goto('/panel');
  await expect(page.getByRole('heading', { name: '最近，有什么事放在心上？' })).toBeVisible();
  await expect(page.getByRole('link', { name: /把事业问题想清楚/ })).toHaveAttribute('href', '/career');
  await expect(page.getByText('排盘时间说明', { exact: true })).toHaveCount(0);
  await expect(page.getByText('下一步可以这样问', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '命盘与背景', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '关闭面板' }).click();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/fate-soft-${info.project.name}-welcome.png`, fullPage: true });
  await page.getByRole('textbox', { name: '对话输入框' }).fill('我该怎样规划接下来的工作？');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByText('这是一段固定回复', { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: '最近，有什么事放在心上？' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '停止', exact: true })).toHaveCount(0, { timeout: 30_000 });
  await page.screenshot({ path: `/private/tmp/fate-soft-${info.project.name}-conversation.png`, fullPage: true });
});
