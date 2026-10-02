// Fresh browser fixtures prove discovery UI; SQL ownership is covered separately.
import { test, expect, type Page } from '@playwright/test';

const original = '### 核心观察\n\n原解读的观察。\n\n### 分析依据\n\n原解读的依据。\n\n### 现实建议\n\n原解读的建议。';
const question = '入职前应先核对什么？';
const context = { taskType: 'career', mode: 'bazi', title: '事业方向', facts: { topic: '职业选择', currentSituation: '仍在原公司' } };
const hexagram = { id: 7, hexagram_id: 'discovery-fixture', question: '是否接受 offer？', gender: 'male', method: 'number',
  numbers: { numbers: [3, 5, 7] }, main_gua: '乾', change_gua: '姤', shi_yao: 6, ying_yao: 3, lines: { lines: [] },
  timestamp: '2026-10-03T00:00:00Z', created_at: '2026-10-03T00:00:00Z', solar_time: false, location: '上海' };
const remoteKey = 'a'.repeat(32);
const localKey = 'b'.repeat(32);
type SavedMessage = { id: number; role: string; content: string };

async function fixture(page: Page, surface: string, messages: SavedMessage[]) {
  if (surface === 'panel') await page.addInitScript(() => localStorage.setItem('chat:active:bazi', 'bazi_conv_9001'));
  const id = surface === 'liuyao' ? 9003 : 9001;
  await page.route(`**/api/conversations/${id}`, route => route.fulfill({ json: { id, type: surface === 'liuyao' ? 'liuyao' : 'bazi',
    title: '原问题', task_context: surface === 'liuyao' ? { ...context, mode: 'liuyao' } : context, hexagram: surface === 'liuyao' ? hexagram : undefined, messages } }));
  await page.goto(surface === 'panel' ? '/panel' : surface === 'liuyao' ? '/liuyao?conv_id=9003' : '/chat?conv_id=9001');
  await expect(page.getByText('原解读的观察。')).toBeVisible();
}

for (const surface of ['panel', 'chat', 'liuyao']) {
  const kind = surface === 'liuyao' ? 'liuyao' : 'bazi';
  const cid = `${kind}_conv_${kind === 'liuyao' ? 9003 : 9001}`;
  const payload = kind === 'liuyao' ? { message: question } : { message: question, display_message: question, task_context: context };

  test(`${surface}: a fresh device discovers a pending question and recovers its answer without posting again`, async ({ page }) => {
    let done = false;
    let posts = 0;
    const messages = [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }];
    await page.route('**/api/chat/conversations/*/request', route => route.fulfill({ json: done ? { state: 'idle', conversation_id: cid }
      : { state: 'pending', conversation_id: cid, kind, request_key: remoteKey, baseline_message_id: 2, request_payload: payload } }));
    await page.route('**/api/chat/requests/*', route => route.fulfill({ json: done ? { state: 'succeeded', conversation_id: cid, message_id: 4, reply: '原问题已经保存的回答。' }
      : { state: 'pending', conversation_id: cid } }));
    page.on('request', request => { if (request.method() === 'POST' && (request.url().endsWith('/api/chat') || request.url().includes('/chat/quick'))) posts++; });
    await fixture(page, surface, messages);
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await expect(input).toHaveValue(question);
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
    await input.fill('我还想确认书面岗位职责。');
    messages.push({ id: 3, role: 'user', content: question }, { id: 4, role: 'assistant', content: '原问题已经保存的回答。' });
    done = true;
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByText('原问题已经保存的回答。')).toBeVisible();
    await expect(input).toHaveValue('我还想确认书面岗位职责。');
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
    expect(posts).toBe(0);
  });

  test(`${surface}: a fresh device retries the original quick operation and request key`, async ({ page }) => {
    const prompt = '请基于原始计算结果分析入职前需要核实哪些具体条件。';
    const quick = kind === 'liuyao' ? { label: '核对条件', prompt } : { message: prompt, display_message: '核对条件', task_context: context };
    let calls = 0;
    await page.route('**/api/chat/conversations/*/request', route => route.fulfill({ json: { state: 'retryable', conversation_id: cid,
      request_key: remoteKey, kind, baseline_message_id: 2, request_payload: quick } }));
    await page.route(kind === 'liuyao' ? '**/api/liuyao/discovery-fixture/chat/quick' : '**/api/chat', route => {
      calls++;
      expect(route.request().postDataJSON()).toMatchObject({ conversation_id: cid, request_key: remoteKey, ...quick });
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"完整的快捷追问回答。","replace":true}\n\ndata: {"meta":{"message_id":4}}\n\ndata: [DONE]\n\n' });
    });
    await fixture(page, surface, [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }]);
    await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(prompt);
    await page.getByRole('button', { name: '发送', exact: true }).click();
    await expect(page.getByText('完整的快捷追问回答。')).toBeVisible();
    await expect(page.getByText('原解读的观察。')).toBeVisible();
    expect(calls).toBe(1);
  });

  test(`${surface}: a different pending request cannot overwrite this browser’s edited draft`, async ({ page }) => {
    await page.addInitScript(({ cid, kind, context, localKey }) => {
      const draft = kind === 'bazi' ? { requestKey: localKey, prompt: '本机正在编辑的新问题。', originalPrompt: '本机原问题。',
        submittedPrompt: '本机原问题。', display: '本机原问题。', taskContext: context, retryable: true }
        : { requestKey: localKey, prompt: '本机正在编辑的新问题。', submittedPrompt: '本机原问题。', display: '本机原问题。', baselineMessageId: 2, retryable: true };
      sessionStorage.setItem(`${kind}:pending:90001:${cid}`, JSON.stringify(draft));
    }, { cid, kind, context, localKey });
    let done = false;
    const messages = [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }];
    await page.route('**/api/chat/conversations/*/request', route => route.fulfill({ json: done ? { state: 'idle', conversation_id: cid }
      : { state: 'pending', conversation_id: cid, request_key: remoteKey, kind, baseline_message_id: 2, request_payload: payload } }));
    await page.route(`**/api/chat/requests/${localKey}`, route => route.fulfill({ json: { state: 'retryable', conversation_id: cid } }));
    await fixture(page, surface, messages);
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await expect(input).toHaveValue('本机正在编辑的新问题。');
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
    done = true;
    messages.push({ id: 3, role: 'user', content: question }, { id: 4, role: 'assistant', content: '另一页面已保存的回答。' });
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByText('另一页面已保存的回答。')).toBeVisible();
    await expect(input).toHaveValue('本机正在编辑的新问题。');
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
  });

  test(`${surface}: a discovery failure blocks generation and can recover through a read`, async ({ page }) => {
    let available = false;
    await page.route('**/api/chat/conversations/*/request', route => route.fulfill(available
      ? { json: { state: 'idle', conversation_id: cid } } : { status: 503, json: { detail: '请求查询暂不可用' } }));
    await fixture(page, surface, [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }]);
    await expect(page.getByText('请求查询暂不可用')).toBeVisible();
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await input.fill('新的问题。');
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
    available = true;
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
    await expect(input).toHaveValue('新的问题。');
  });

  test(`${surface}: a locally retryable draft shows recovery when another device is retrying the same key`, async ({ page }) => {
    await page.addInitScript(({ cid, kind, context, remoteKey, question }) => {
      const draft = kind === 'bazi' ? { requestKey: remoteKey, prompt: '本机想继续问的新问题。', originalPrompt: question,
        submittedPrompt: question, display: question, taskContext: context, retryable: true }
        : { requestKey: remoteKey, prompt: '本机想继续问的新问题。', submittedPrompt: question, display: question, baselineMessageId: 2, retryable: true };
      sessionStorage.setItem(`${kind}:pending:90001:${cid}`, JSON.stringify(draft));
    }, { cid, kind, context, remoteKey, question });
    let done = false;
    const messages = [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }];
    await page.route('**/api/chat/conversations/*/request', route => route.fulfill({ json: done ? { state: 'idle', conversation_id: cid }
      : { state: 'pending', conversation_id: cid, request_key: remoteKey, kind, baseline_message_id: 2, request_payload: payload } }));
    await page.route(`**/api/chat/requests/${remoteKey}`, route => route.fulfill({ json: done
      ? { state: 'succeeded', conversation_id: cid, message_id: 4, reply: '另一设备重试后保存的回答。' } : { state: 'pending', conversation_id: cid } }));
    await fixture(page, surface, messages);
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: '重新加载对话' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue('本机想继续问的新问题。');
    done = true;
    messages.push({ id: 3, role: 'user', content: question }, { id: 4, role: 'assistant', content: '另一设备重试后保存的回答。' });
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByText('另一设备重试后保存的回答。')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue('本机想继续问的新问题。');
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
  });

  test(`${surface}: a legacy request without a saved body never invents a question`, async ({ page }) => {
    let expired = false;
    await page.route('**/api/chat/conversations/*/request', route => route.fulfill({ json: { state: expired ? 'retryable' : 'pending',
      conversation_id: cid, request_key: remoteKey, kind, baseline_message_id: 2, request_payload: null } }));
    await fixture(page, surface, [{ id: 1, role: 'user', content: '原问题' }, { id: 2, role: 'assistant', content: original }]);
    const input = page.getByRole('textbox', { name: '对话输入框' });
    await expect(input).toHaveValue('');
    await input.fill('我自己填写的新问题。');
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled();
    expired = true;
    await page.getByRole('button', { name: '重新加载对话' }).click();
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled();
    await expect(input).toHaveValue('我自己填写的新问题。');
    await expect(page.getByText(/旧请求没有保存原问题草稿/)).toBeVisible();
  });
}
