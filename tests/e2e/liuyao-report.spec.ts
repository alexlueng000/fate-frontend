// UI contract fixtures: exercises saved hexagram restoration, not model quality.
import { test, expect } from '@playwright/test';

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
