// UI recovery contracts use fixed endpoints, not a real model or MySQL.
import { test, expect, type Page } from '@playwright/test';

const titles = ['个人画像', '性格特点', '做事方式', '人际与感情', '行动建议', '三年关键节点', '免责声明'];
const report = titles.map(title => `### ${title}\n\n原报告内容：${title}。`).join('\n\n');
const answer = '已经保存的章节追问回复。';
const profile = { id: 90001, ai_report: report, report_conversation_id: 9001, gender: 'male',
  bazi_chart: { mingpan: { four_pillars: { year: ['甲', '子'], month: ['丙', '寅'], day: ['戊', '辰'], hour: ['庚', '午'] }, dayun: [] } } };
type Row = { id: number; role: string; content: string };

async function setup(page: Page, messages: Row[]) {
  await page.route('**/api/profile/me', route => route.fulfill({ json: profile }));
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: '个人报告', profile, messages } }));
  await page.route('**/api/chat/conversations/*/request', route => route.fulfill({ json: { state: 'idle', conversation_id: 'bazi_conv_9001' } }));
  await page.goto('/report');
  await page.getByRole('button', { name: '针对这一节提问', exact: true }).first().click();
  await expect(page.getByRole('button', { name: '发送追问', exact: true })).toBeEnabled();
}
const initialMessages = (): Row[] => [{ id: 1, role: 'user', content: '我的命盘信息如下：' }, { id: 2, role: 'assistant', content: report }];

test('chapter failure preserves report and quote; reopening retries the same request', async ({ page }, info) => {
  const messages = initialMessages();
  let calls = 0, firstKey = '', firstPrompt = '';
  await page.route('**/api/chat/requests/*', route => route.fulfill({ json: { state: 'retryable', conversation_id: 'bazi_conv_9001' } }));
  await page.route('**/api/chat', route => {
    const payload = route.request().postDataJSON(); calls++;
    expect(payload.conversation_id).toBe('bazi_conv_9001');
    expect(payload.request_key).toMatch(/^[a-f0-9]{32}$/);
    expect(payload.message).toContain('原报告内容：个人画像。');
    if (calls === 1) {
      firstKey = payload.request_key; firstPrompt = payload.message;
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"未保存的章节半截内容","replace":true}\n\ndata: {"error":"生成失败","status":500}\n\n' });
    }
    expect(payload.request_key).toBe(firstKey); expect(payload.message).toBe(firstPrompt);
    messages.push({ id: 3, role: 'user', content: payload.message }, { id: 4, role: 'assistant', content: answer });
    return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: answer, replace: true })}\n\ndata: {"meta":{"message_id":4}}\n\ndata: [DONE]\n\n` });
  });
  await setup(page, messages);
  const composer = page.getByRole('region', { name: '章节追问' });
  await composer.getByRole('button', { name: '发送追问', exact: true }).click();
  await expect(composer.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  await expect(page.getByText('未保存的章节半截内容')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: '针对这一节提问', exact: true }).first().click();
  await expect(composer.getByRole('textbox')).toHaveValue(firstPrompt);
  await expect(composer.getByRole('button', { name: '发送追问', exact: true })).toBeDisabled();
  await composer.getByRole('button', { name: '重新加载对话' }).click();
  await expect(composer.getByText('原报告内容：个人画像。', { exact: true })).toHaveCount(0);
  await expect(composer.getByRole('button', { name: '发送追问', exact: true })).toBeEnabled();
  await composer.getByRole('button', { name: '发送追问', exact: true }).click();
  await expect(composer.getByText(answer)).toBeVisible();
  await expect(composer.getByRole('textbox')).toHaveValue('');
  await expect(composer.getByRole('button', { name: '发送追问', exact: true })).toBeDisabled();
  await composer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/private/tmp/fate-chapter-question-${info.project.name}.png` });
  expect(calls).toBe(2);
  await expect(page.getByRole('navigation', { name: '报告章节目录' }).getByRole('button')).toHaveCount(7);
});

test('a mismatched saved reply never renders as a recovered chapter answer', async ({ page }) => {
  const messages = initialMessages();
  await page.route('**/api/chat', route => route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"未确认的内容","replace":true}\n\n' }));
  await page.route('**/api/chat/requests/*', route => route.fulfill({ json: { state: 'succeeded', conversation_id: 'bazi_conv_9001', message_id: 4, reply: '无法匹配的回复' } }));
  messages.push({ id: 3, role: 'user', content: '已存问题' }, { id: 4, role: 'assistant', content: '数据库中的另一条回复' });
  await setup(page, messages);
  const composer = page.getByRole('region', { name: '章节追问' });
  await composer.getByRole('button', { name: '发送追问', exact: true }).click();
  await composer.getByRole('button', { name: '重新加载对话' }).click();
  await expect(composer.getByRole('alert')).toContainText('当前记录尚未包含该回复');
  await expect(composer.getByText('无法匹配的回复')).toHaveCount(0);
  await expect(composer.getByText('数据库中的另一条回复')).toHaveCount(0);
  await expect(composer.getByRole('button', { name: '发送追问', exact: true })).toBeDisabled();
});

test('chapter recovery reads committed answer and retains a new draft without reposting', async ({ page }) => {
  const messages = initialMessages();
  let calls = 0, saved = false;
  await page.route('**/api/chat/requests/*', route => route.fulfill({ json: saved
    ? { state: 'succeeded', conversation_id: 'bazi_conv_9001', message_id: 4, reply: answer }
    : { state: 'pending', conversation_id: 'bazi_conv_9001' } }));
  await page.route('**/api/chat', route => {
    calls++;
    messages.push({ id: 3, role: 'user', content: route.request().postDataJSON().message }, { id: 4, role: 'assistant', content: answer });
    return route.fulfill({ contentType: 'text/event-stream', body: `data: ${JSON.stringify({ text: answer, replace: true })}\n\n` });
  });
  await setup(page, messages);
  const composer = page.getByRole('region', { name: '章节追问' });
  await composer.getByRole('button', { name: '发送追问', exact: true }).click();
  await composer.getByRole('button', { name: '重新加载对话' }).click();
  await expect(composer.getByRole('button', { name: '发送追问', exact: true })).toBeDisabled();
  await composer.getByRole('textbox').fill('我还想补充一项现实信息。');
  saved = true;
  await composer.getByRole('button', { name: '重新加载对话' }).click();
  await expect(composer.getByText(answer)).toBeVisible();
  await expect(composer.getByRole('textbox')).toHaveValue('我还想补充一项现实信息。');
  await expect(composer.getByRole('link', { name: '查看原对话' })).toHaveAttribute('href', '/chat?conv_id=9001');
  expect(calls).toBe(1);
});

test('another page pending question blocks chapter sending and restores its original draft', async ({ page }) => {
  let posts = 0;
  await setup(page, initialMessages());
  await page.getByRole('region', { name: '章节追问' }).getByRole('button', { name: '关闭', exact: true }).click();
  await page.route('**/api/chat', route => { posts++; return route.abort(); });
  const originalQuestion = '关于原报告，请核对我明确提供的岗位条件。';
  await page.route('**/api/chat/conversations/*/request', route => route.fulfill({ json: {
    state: 'pending', conversation_id: 'bazi_conv_9001', request_key: 'b'.repeat(32), kind: 'bazi', baseline_message_id: 2,
    request_payload: { message: originalQuestion, display_message: originalQuestion, task_context: null },
  } }));
  await page.getByRole('button', { name: '针对这一节提问', exact: true }).first().click();
  const composer = page.getByRole('region', { name: '章节追问' });
  await expect(composer.getByRole('button', { name: '发送追问', exact: true })).toBeDisabled();
  await expect(composer.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  await expect(composer.getByRole('textbox')).toHaveValue(originalQuestion);
  expect(posts).toBe(0);
});

test('closing an in-flight chapter retains its request; reopening checks before retry', async ({ page }) => {
  let calls = 0, release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/chat', async route => { calls++; await held; await route.abort().catch(() => {}); });
  await setup(page, initialMessages());
  const composer = page.getByRole('region', { name: '章节追问' });
  const original = await composer.getByRole('textbox').inputValue();
  await composer.getByRole('button', { name: '发送追问', exact: true }).click();
  await expect(composer.getByRole('button', { name: '停止', exact: true })).toBeVisible();
  await composer.getByRole('button', { name: '关闭', exact: true }).click();
  release();
  await page.getByRole('button', { name: '针对这一节提问', exact: true }).nth(1).click();
  await expect(composer.getByRole('textbox')).toHaveValue(original);
  await expect(composer.getByRole('button', { name: '发送追问', exact: true })).toBeDisabled();
  await expect(composer.getByRole('button', { name: '重新加载对话' })).toBeVisible();
  expect(calls).toBe(1);
});
