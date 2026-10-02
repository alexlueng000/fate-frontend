// UI contract fixtures: exercises saved hexagram restoration, not model quality.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/chat/requests/*', route => route.fulfill({ json: { state: 'retryable', conversation_id: 'liuyao_conv_9003' } }));
});

const question = '是否接受已经收到的新工作 offer？';
const followUp = '入职前应核对哪些具体条件？';
const content = '### 核心判断\u2060\n先确认岗位职责和承诺的条件。\n### 分析依据\u2060\n这是固定测试依据。\n### 行动建议\u2060\n向招聘方索取书面岗位说明。';
const hexagram = { id: 7, hexagram_id: 'fixture-hexagram', question, gender: 'male', method: 'number', numbers: { numbers: [3, 5, 7] },
  main_gua: '乾', change_gua: '姤', shi_yao: 6, ying_yao: 3, lines: { lines: [] }, ganzhi: null, created_at: '2026-10-02T00:00:00Z',
  timestamp: '2026-10-02T00:00:00Z', location: '上海', solar_time: false, gua_type: null, jiqi: null,
};

test('saved Liuyao report restores its own question, hexagram and follow-up draft', async ({ page }, info) => {
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram,
    task_context: { taskType: 'career', mode: 'liuyao', facts: { topic: question, currentSituation: '收到 offer', options: '留任或入职' } },
    messages: [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }] } }));
  await page.goto(`/liuyao?conv_id=9003&question=${encodeURIComponent(followUp)}`);
  await expect(page.getByRole('heading', { name: question, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看完整报告' })).toHaveAttribute('href', '/reports/9003');
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(followUp);
  await expect(page.getByText('这是固定测试依据。')).toBeHidden();
  await page.getByRole('button', { name: '查看分析依据' }).click();
  await expect(page.getByText('这是固定测试依据。')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByText('先确认岗位职责和承诺的条件。').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/private/tmp/fate-liuyao-report-${info.project.name}.png`, fullPage: true });
});

test('failed Liuyao follow-up keeps report and draft across refresh, then retries the attempted question', async ({ page }) => {
  let sends = 0;
  let regenerations = 0;
  let firstRequestKey = '';
  const messages = [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }];
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram, messages } }));
  await page.route('**/api/liuyao/fixture-hexagram/chat/regenerate', route => {
    regenerations++;
    return route.fulfill({ status: 500 });
  });
  await page.route('**/api/liuyao/fixture-hexagram/chat', route => {
    sends++;
    const key = route.request().postDataJSON().request_key;
    expect(key).toMatch(/^[a-f0-9]{32}$/);
    if (sends === 1) firstRequestKey = key;
    else expect(key).toBe(firstRequestKey);
    expect(route.request().postDataJSON().message).toBe(followUp);
    if (sends === 1) return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"error":"未能保存，请重试","status":500}\n\n' });
    const reply = '请核对试用期、职责和书面待遇。';
    messages.push({ id: 3, role: 'user', content: followUp }, { id: 4, role: 'assistant', content: reply });
    return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: reply, replace: true })}\n\ndata: {"meta":{"message_id":4}}\n\ndata: [DONE]\n\n` });
  });
  await page.goto('/liuyao?conv_id=9003');
  const input = page.getByRole('textbox', { name: '对话输入框' });
  await input.fill(followUp);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
  await expect(input).toHaveValue(followUp);
  await page.reload();
  await expect(input).toHaveValue(followUp);
  await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByText('请核对试用期、职责和书面待遇。')).toBeVisible();
  expect(sends).toBe(2); expect(regenerations).toBe(0);
});

test('Liuyao reconnect recovers an already saved follow-up without generating again', async ({ page }) => {
  let sends = 0;
  const reply = '这是断流前已保存的追问回答。';
  await page.route('**/api/chat/requests/*', route => route.fulfill({ json: { state: 'succeeded', conversation_id: 'liuyao_conv_9003', message_id: 4, reply } }));
  const messages = [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }];
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram, messages } }));
  await page.route('**/api/liuyao/fixture-hexagram/chat', route => {
    sends++;
    messages.push({ id: 3, role: 'user', content: followUp }, { id: 4, role: 'assistant', content: reply });
    return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: reply, replace: true })}\n\n` });
  });
  await page.goto('/liuyao?conv_id=9003');
  await page.getByRole('textbox', { name: '对话输入框' }).fill(followUp);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByText(reply)).toBeVisible();
  await expect(page.getByText('已读取到这次问题的保存结果，无需重复发送。')).toBeVisible();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue('');
  await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
  expect(sends).toBe(1);
});

test('stopping Liuyao generation cancels the request while preserving the original and attempted question', async ({ page }) => {
  let release: () => void = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram,
    messages: [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }] } }));
  await page.route('**/api/liuyao/fixture-hexagram/chat', async route => {
    await held;
    await route.abort().catch(() => {});
  });
  await page.goto('/liuyao?conv_id=9003');
  await page.getByRole('textbox', { name: '对话输入框' }).fill(followUp);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('button', { name: '重新起卦', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '停止', exact: true }).click();
  release();
  await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(followUp);
  await expect(page.getByText('先确认岗位职责和承诺的条件。')).toBeVisible();
});

test('failed quick action keeps its full prompt as the editable recovery draft', async ({ page }) => {
  const prompt = '请列出入职前需要向招聘方核实的职责、试用期和待遇条件。';
  await page.route('**/api/admin/config?key=liuyao_quick_buttons', route => route.fulfill({ json: { value_json: { items: [{ label: '核对条件', prompt }] } } }));
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram,
    messages: [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }] } }));
  await page.route('**/api/liuyao/fixture-hexagram/chat/quick', route => {
    expect(route.request().postDataJSON()).toMatchObject({ conversation_id: 'liuyao_conv_9003', label: '核对条件', prompt });
    expect(route.request().postDataJSON().request_key).toMatch(/^[a-f0-9]{32}$/);
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"error":"未保存","status":500}\n\n' });
  });
  await page.goto('/liuyao?conv_id=9003');
  const action = page.getByRole('button', { name: '核对条件', exact: true });
  if (!await action.isVisible()) await page.getByRole('button', { name: '下一步可以这样问' }).click();
  await action.click();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(prompt);
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(prompt);
  await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
});

test('recovering a saved reply preserves edits made to the next question', async ({ page }) => {
  await page.route('**/api/chat/requests/*', route => route.fulfill({ json: { state: 'succeeded', conversation_id: 'liuyao_conv_9003', message_id: 4, reply: '已保存的回答。' } }));
  const messages = [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }];
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram, messages } }));
  await page.route('**/api/liuyao/fixture-hexagram/chat', route => {
    messages.push({ id: 3, role: 'user', content: followUp }, { id: 4, role: 'assistant', content: '已保存的回答。' });
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"断流","replace":true}\n\n' });
  });
  await page.goto('/liuyao?conv_id=9003');
  const input = page.getByRole('textbox', { name: '对话输入框' });
  await input.fill(followUp);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  await input.fill('我还想核对岗位的工作时间。');
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByText('已保存的回答。')).toBeVisible();
  await expect(input).toHaveValue('我还想核对岗位的工作时间。');
});

test('a pending Liuyao request prevents resend after refresh until its server state changes', async ({ page }) => {
  let pending = true;
  let sends = 0;
  let requestKey = '';
  const messages = [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }];
  await page.route('**/api/chat/requests/*', route => {
    expect(route.request().url().endsWith(requestKey)).toBe(true);
    return route.fulfill({ json: { state: pending ? 'pending' : 'retryable', conversation_id: 'liuyao_conv_9003' } });
  });
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram, messages } }));
  await page.route('**/api/liuyao/fixture-hexagram/chat', route => {
    sends++;
    if (sends === 1) requestKey = route.request().postDataJSON().request_key;
    else expect(route.request().postDataJSON().request_key).toBe(requestKey);
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"连接中断","replace":true}\n\n' });
  });
  await page.goto('/liuyao?conv_id=9003');
  await page.getByRole('textbox', { name: '对话输入框' }).fill(followUp);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByText('这个问题仍在生成，请稍后重新加载。原解读与草稿已保留。')).toBeVisible();
  await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
  expect(sends).toBe(1);
  pending = false;
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  expect(sends).toBe(2);
});

test('retrying a quick question reuses its original operation and request key', async ({ page }) => {
  const prompt = '请核对入职岗位的职责、试用期及待遇条件。';
  let sends = 0;
  let firstKey = '';
  await page.route('**/api/admin/config?key=liuyao_quick_buttons', route => route.fulfill({ json: { value_json: { items: [{ label: '核对条件', prompt }] } } }));
  await page.route('**/api/conversations/9003', route => route.fulfill({ json: { id: 9003, type: 'liuyao', title: question, hexagram,
    messages: [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }] } }));
  await page.route('**/api/liuyao/fixture-hexagram/chat/quick', route => {
    sends++;
    const payload = route.request().postDataJSON();
    expect(payload).toMatchObject({ label: '核对条件', prompt });
    if (sends === 1) firstKey = payload.request_key;
    else expect(payload.request_key).toBe(firstKey);
    return route.fulfill({ contentType: 'text/event-stream', body: sends === 1
      ? 'data: {"error":"未保存","status":500}\n\n'
      : 'data: {"text":"已恢复原快捷问题。","replace":true}\n\ndata: [DONE]\n\n' });
  });
  await page.goto('/liuyao?conv_id=9003');
  const action = page.getByRole('button', { name: '核对条件', exact: true });
  if (!await action.isVisible()) await page.getByRole('button', { name: '下一步可以这样问' }).click();
  await action.click();
  await page.getByRole('button', { name: '重新加载对话' }).click();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(prompt);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByText('已恢复原快捷问题。')).toBeVisible();
  expect(sends).toBe(2);
});
