// UI action contracts with endpoint fixtures; not a live model/database test.
import { test, expect } from '@playwright/test';

const original = '### 核心观察\n原报告的观察。\n### 分析依据\n原报告的依据。\n### 现实建议\n原报告的建议。';
const alternative = original.replaceAll('原报告', '新解读');

test('regeneration preserves original answer and restores both from server after reload', async ({ page }) => {
  let regenerated = 0;
  const messages = [{ id: 1, role: 'user', content: '是否接受 offer？' }, { id: 2, role: 'assistant', content: original }];
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: '事业问题', messages } }));
  await page.route('**/api/chat/regenerate', async route => {
    expect(route.request().postDataJSON()).toEqual({ conversation_id: 'bazi_conv_9001', expected_message_id: 2 });
    regenerated++;
    messages.push({ id: 3, role: 'assistant', content: alternative });
    await route.fulfill({ json: { conversation_id: 'bazi_conv_9001', reply: alternative, message_id: 3 } });
  });
  await page.goto('/chat?conv_id=9001');
  await expect(page.getByText('原报告的观察。')).toBeVisible();
  await page.getByRole('button', { name: '重新解读这条回复' }).click();
  await expect(page.getByText('新解读的观察。')).toBeVisible();
  await expect(page.getByText('原报告的观察。')).toBeVisible();
  await expect(page.getByText('重新解读 · 原回答已保留')).toBeVisible();
  await page.evaluate(() => {
    Object.keys(localStorage).filter(key => key.startsWith('chat:conv:')).forEach(key => localStorage.removeItem(key));
  });
  await page.reload();
  await expect(page.getByText('原报告的观察。')).toBeVisible();
  await expect(page.getByText('新解读的观察。')).toBeVisible();
  expect(regenerated).toBe(1);
});

test('failed regeneration leaves the original readable and can retry', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: '事业问题',
    messages: [{ id: 1, role: 'user', content: '是否接受 offer？' }, { id: 2, role: 'assistant', content: original }] } }));
  await page.route('**/api/chat/regenerate', route => {
    attempts++;
    return route.fulfill(attempts === 1 ? { status: 503, json: { detail: 'AI 暂时不可用，原回答已保留。' } }
      : { json: { reply: alternative, message_id: 3 } });
  });
  await page.goto('/chat?conv_id=9001');
  await page.getByRole('button', { name: '重新解读这条回复' }).click();
  await expect(page.getByText(/AI 暂时不可用/)).toBeVisible();
  await expect(page.getByText('原报告的观察。')).toBeVisible();
  await page.getByRole('button', { name: '重新解读这条回复' }).click();
  await expect(page.getByText('新解读的观察。')).toBeVisible();
  expect(attempts).toBe(2);
});

test('clear switches to an empty conversation without caching old answers under its new ID', async ({ page }) => {
  await page.addInitScript(({ original }) => {
    if (!localStorage.getItem('actions-fixture-seeded')) {
      localStorage.setItem('actions-fixture-seeded', '1');
      localStorage.setItem('chat:active:bazi', 'bazi_conv_9001');
      localStorage.setItem('chat:conv:bazi_conv_9001', JSON.stringify([
        { role: 'user', content: '旧会话的问题' }, { role: 'assistant', content: original, meta: { messageId: 2 } },
      ]));
    }
  }, { original });
  let clearCalls = 0;
  await page.route('**/api/chat/clear', route => {
    clearCalls++;
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    return route.fulfill({ json: { ok: true, conversation_id: 'bazi_conv_9002' } });
  });
  let delayedIntro = false;
  await page.route('**/api/config/bazi_intro', async route => {
    if (delayedIntro) {
      // The pre-existing persistence effect must never see new ID + old rows.
      expect(await page.evaluate(() => localStorage.getItem('chat:conv:bazi_conv_9002'))).toBeNull();
    }
    await route.fulfill({ json: { content: '准备好了，可以从新的问题开始。' } });
  });
  await page.goto('/panel');
  await expect(page.getByText('原报告的观察。')).toBeVisible();
  delayedIntro = true;
  await page.getByRole('button', { name: '更多操作' }).click();
  await page.getByRole('menuitem', { name: '清空对话' }).click();
  await expect(page.getByText(/原对话与报告保留/)).toBeVisible();
  await page.getByRole('button', { name: '确认清空' }).click();
  await expect(page.getByRole('heading', { name: '最近，有什么事放在心上？' })).toBeVisible();
  await expect(page.getByText('原报告的观察。')).toHaveCount(0);
  const saved = await page.evaluate(() => ({ active: localStorage.getItem('chat:active:bazi'),
    old: localStorage.getItem('chat:conv:bazi_conv_9001'), fresh: localStorage.getItem('chat:conv:bazi_conv_9002') }));
  expect(saved.active).toBe('bazi_conv_9002');
  expect(saved.old).toContain('原报告'); expect(saved.fresh).not.toContain('原报告');
  delayedIntro = false;
  await page.reload();
  await expect(page.getByRole('heading', { name: '最近，有什么事放在心上？' })).toBeVisible();
  expect(clearCalls).toBe(1);
});
