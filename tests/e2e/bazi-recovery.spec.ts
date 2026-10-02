// Interface fixtures exercise user-visible recovery; not real model/MySQL evidence.
import { test, expect, type Page } from '@playwright/test';

const original = '### 核心观察\n已保存的原观察。\n### 分析依据\n已保存的原依据。\n### 现实建议\n已保存的原建议。';
const question = '选择前应当先核对哪些条件？';
const context = { taskType: 'career', mode: 'bazi', title: '长期事业方向', facts: { topic: '如何选择职业方向', currentSituation: '目前仍在原公司', options: '留任或换岗', timeframe: '三个月' } };
const chart = { gender: '男', solar_date: '1993-03-09 07:00:00', four_pillars: { year: ['甲', '子'], month: ['丙', '寅'], day: ['戊', '辰'], hour: ['庚', '午'] }, dayun: [] };
type SavedMessage = { id: number; role: string; content: string };

async function fixture(page: Page, surface: string, messages: SavedMessage[]) {
  if (surface === 'panel') await page.addInitScript(() => {
    localStorage.setItem('chat:active:bazi', 'bazi_conv_9001');
    localStorage.setItem('chat:conv:bazi_conv_9001', JSON.stringify([{ role: 'assistant', content: '陈旧缓存中的错误回答。' }]));
  });
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: '事业问题',
    task_context: context, profile: { bazi_chart: { mingpan: chart } }, profile_changed: true, messages } }));
  await page.goto(surface === 'panel' ? '/panel' : '/chat?conv_id=9001');
  if (messages.length) await expect(page.getByText('已保存的原观察。')).toBeVisible();
  else await expect(page.getByRole('heading', { name: '最近，有什么事放在心上？' })).toBeVisible();
  await expect(page.getByText('陈旧缓存中的错误回答。')).toHaveCount(0);
}

for (const surface of ['panel', 'chat']) {
  test(`${surface}: failed follow-up retains original/draft after refresh and reuses its key`, async ({ page }) => {
    const messages = [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }];
    let calls = 0;
    let firstKey = '';
    await page.route('**/api/chat/requests/*', route => route.fulfill({ json: { state: 'retryable', conversation_id: 'bazi_conv_9001' } }));
    await page.route('**/api/chat', route => {
      const payload = route.request().postDataJSON();
      calls++;
      expect(payload).toMatchObject({ message: question, display_message: question, task_context: context });
      if (calls === 1) firstKey = payload.request_key;
      else expect(payload.request_key).toBe(firstKey);
      expect(payload.request_key).toMatch(/^[a-f0-9]{32}$/);
      if (calls === 1) return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"未完成的半截回答","replace":true}\n\ndata: {"error":"生成失败","status":500}\n\n' });
      messages.push({ id: 3, role: 'user', content: question }, { id: 4, role: 'assistant', content: '完整的新回答。' });
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"完整的新回答。","replace":true}\n\ndata: {"meta":{"message_id":4}}\n\ndata: [DONE]\n\n' });
    });
    await fixture(page, surface, messages);
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await input.fill(question);
    await page.getByRole('button', { name: '发送', exact: true }).click();
    await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
    await expect(page.getByText('未完成的半截回答')).toHaveCount(0);
    await expect(page.getByText('已保存的原观察。')).toBeVisible();
    await expect(input).toHaveValue(question);
    await page.reload();
    await expect(input).toHaveValue(question);
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: '发送', exact: true }).click();
    await expect(page.getByText('完整的新回答。')).toBeVisible();
    expect(calls).toBe(2);
  });

  test(`${surface}: pending attempts cannot resend and completed recovery keeps an edited next question`, async ({ page }) => {
    const messages = [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }];
    let complete = false;
    let calls = 0;
    await page.route('**/api/chat/requests/*', route => route.fulfill({ json: complete
      ? { state: 'succeeded', conversation_id: 'bazi_conv_9001', message_id: 4, reply: '断流前已保存的回答。' }
      : { state: 'pending', conversation_id: 'bazi_conv_9001' } }));
    await page.route('**/api/chat', route => {
      calls++;
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"连接中断","replace":true}\n\n' });
    });
    await fixture(page, surface, messages);
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await input.fill(question);
    await page.getByRole('button', { name: '发送', exact: true }).click();
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByText('这个问题仍在生成，请稍后重新加载。原解读与草稿已保留。')).toBeVisible();
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
    await input.fill('我还想核对岗位职责。');
    messages.push({ id: 3, role: 'user', content: question }, { id: 4, role: 'assistant', content: '断流前已保存的回答。' });
    complete = true;
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByText('断流前已保存的回答。')).toBeVisible();
    await expect(input).toHaveValue('我还想核对岗位职责。');
    expect(calls).toBe(1);
  });

  test(`${surface}: quick question retry keeps its original prompt, label and facts`, async ({ page }) => {
    const prompt = '请根据原命盘说明选择岗位时要核对哪些条件。';
    let calls = 0;
    let firstKey = '';
    await page.route('**/api/config/quick_buttons', route => route.fulfill({ json: [{ label: '核对岗位', prompt }] }));
    await page.route('**/api/chat/requests/*', route => route.fulfill({ json: { state: 'retryable', conversation_id: 'bazi_conv_9001' } }));
    await page.route('**/api/chat', route => {
      calls++;
      const payload = route.request().postDataJSON();
      expect(payload).toMatchObject({ message: prompt, display_message: '核对岗位', task_context: context });
      if (calls === 1) firstKey = payload.request_key;
      else expect(payload.request_key).toBe(firstKey);
      return route.fulfill({ contentType: 'text/event-stream', body: calls === 1 ? 'data: {"error":"失败","status":500}\n\n'
        : 'data: {"text":"同一快捷问题的完整回答。","replace":true}\n\ndata: {"meta":{"message_id":4}}\n\ndata: [DONE]\n\n' });
    });
    await fixture(page, surface, surface === 'panel' ? [] : [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }]);
    const quick = page.getByRole('button', { name: '核对岗位', exact: true });
    if (surface === 'chat' && !await quick.isVisible()) await page.getByRole('button', { name: '下一步可以这样问' }).click();
    await quick.click();
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await expect(input).toHaveValue(prompt);
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await page.getByRole('button', { name: '发送', exact: true }).click();
    await expect(page.getByText('同一快捷问题的完整回答。')).toBeVisible();
    expect(calls).toBe(2);
  });

  test(`${surface}: stop retains original and draft without recording partial output`, async ({ page }) => {
    let release = () => {};
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/chat', async route => { await held; await route.abort().catch(() => {}); });
    await fixture(page, surface, [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }]);
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await input.fill(question);
    await page.getByRole('button', { name: '发送', exact: true }).click();
    await page.getByRole('button', { name: '停止', exact: true }).click();
    release();
    await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
    await expect(page.getByText('已保存的原观察。')).toBeVisible();
    await expect(input).toHaveValue(question);
  });
}

test('panel restores the original chart and background instead of the current profile or stale task', async ({ page }, info) => {
  await fixture(page, 'panel', [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }]);
  await page.getByRole('button', { name: '命盘与背景', exact: true }).click();
  await expect(page.getByText('档案后来有过修改，本次对话继续使用保存时的命盘。')).toBeVisible();
  await expect(page.getByText('本次会话保存的命盘 · 排盘时间 1993-03-09 07:00:00')).toBeVisible();
  await expect(page.getByText('目前仍在原公司')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `/private/tmp/fate-bazi-saved-context-${info.project.name}.png`, fullPage: true });
});

test('panel refuses another account’s cached conversation before showing its contents', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('chat:active:bazi', 'bazi_conv_9001');
    localStorage.setItem('chat:conv:bazi_conv_9001', JSON.stringify([{ role: 'assistant', content: '另一个账号的私密回答。' }]));
  });
  await page.route('**/api/conversations/9001', route => route.fulfill({ status: 404, json: { detail: '会话不存在' } }));
  await page.route('**/api/chat/init', route => route.fulfill({ json: { conversation_id: 'bazi_conv_9002' } }));
  await page.goto('/panel');
  await expect(page.getByRole('heading', { name: '最近，有什么事放在心上？' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toBeEnabled();
  await expect(page.getByText('另一个账号的私密回答。')).toHaveCount(0);
});

test('an unsaved legacy browser answer remains readable with its source limitation and no direct follow-up', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('chat:conv:bazi_conv_9001', JSON.stringify([{ role: 'assistant', content: '仅保存在旧浏览器的解读。' }]));
  });
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: '旧记录', messages: [] } }));
  await page.goto('/chat?conv_id=9001');
  await expect(page.getByText('仅保存在旧浏览器的解读。')).toBeVisible();
  await expect(page.getByText(/这些旧内容仅保存在此浏览器/)).toBeVisible();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '重新解读这条回复' })).toBeDisabled();
});
