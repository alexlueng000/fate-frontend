// UI contract fixtures only. Real model/MySQL acceptance is a separate gate.
import { test, expect } from '@playwright/test';

const question = '如何选择更适合自己的职业方向？';
const suggested = '我可以先核对哪些岗位条件？';
const content = '### 核心观察\n\n先明确你希望积累的能力。\n\n### 分析依据\n\n这是测试提供的分析依据，不是真实模型结论。\n\n### 现实建议\n\n向招聘方核对岗位职责，再根据书面说明复盘。\n\n---SUGGESTED_QUESTIONS---\n1. ' + suggested + '\n---END_SUGGESTED_QUESTIONS---';
const context = { taskType: 'career', mode: 'bazi', title: '长期事业方向', facts: { topic: question, currentSituation: '工作稳定，但成长有限', timeframe: '未来三年' } };
const report = { conversation_id: 9001, source_message_id: 2, type: 'bazi', kind: 'topic', title: '事业咨询', question, facts: context.facts, generated_at: '2026-10-02T08:00:00Z', content,
  sections: [{ title: '核心观察', body: '先明确你希望积累的能力。' }, { title: '分析依据', body: '这是测试提供的分析依据，不是真实模型结论。' }, { title: '现实建议', body: '向招聘方核对岗位职责，再根据书面说明复盘。' }],
  profile: { bazi_chart: { mingpan: { four_pillars: { year: ['甲', '子'], month: ['丙', '寅'], day: ['戊', '辰'], hour: ['庚', '午'] } } } }, profile_changed: true, task_context: context,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/career-progress?*', route => route.fulfill({ json: [] }));
});

test('saved report: facts, source chart, sections, original and editable follow-up', async ({ page }, info) => {
  await page.route('**/api/conversations/9001/report', route => route.fulfill({ json: report }));
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: question, messages: [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content }], profile: report.profile, task_context: context } }));
  await page.goto('/reports/9001');
  await expect(page.getByRole('heading', { name: question })).toBeVisible();
  await expect(page.getByText('先明确你希望积累的能力。')).toBeVisible();
  await expect(page.getByText('这是测试提供的分析依据，不是真实模型结论。')).toBeHidden();
  await page.getByRole('button', { name: /02\s*分析依据/ }).click();
  await expect(page.getByText('这是测试提供的分析依据，不是真实模型结论。')).toBeVisible();
  await page.getByText('本次问题、背景与命盘', { exact: true }).click();
  await expect(page.getByText('工作稳定，但成长有限')).toBeVisible();
  await expect(page.getByText('甲子', { exact: true })).toBeVisible();
  await expect(page.getByText(/出生档案后来有过修改/)).toBeVisible();
  await page.getByRole('button', { name: '查看完整原文', exact: true }).click();
  await expect(page.getByText('SUGGESTED_QUESTIONS', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: '返回章节阅读', exact: true }).click();
  await page.getByText('本次问题、背景与命盘', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('heading', { name: '核心观察', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/private/tmp/fate-report-${info.project.name}.png`, fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: question })).toBeVisible();
  await page.getByRole('link', { name: suggested }).click();
  await expect(page).toHaveURL(/\/chat\?conv_id=9001&question=/);
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(suggested);
  await expect(page.getByRole('link', { name: '查看完整报告' })).toHaveAttribute('href', '/reports/9001');
});

test('unfinished report keeps the original conversation accessible', async ({ page }) => {
  await page.route('**/api/conversations/9001/report', route => route.fulfill({ status: 409, json: { detail: 'not complete' } }));
  await page.goto('/reports/9001');
  await expect(page.getByRole('alert').filter({ hasText: '还没有完整报告' })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看原对话' })).toHaveAttribute('href', '/chat?conv_id=9001');
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible();
});

test('personal report preserves all seven chapters', async ({ page }) => {
  const titles = ['个人画像', '性格特点', '做事方式', '人际与感情', '行动建议', '三年关键节点', '免责声明'];
  await page.route('**/api/conversations/9001/report', route => route.fulfill({ json: { ...report, kind: 'personal', content: titles.map(title => `### ${title}\n\n这是${title}的测试原文。`).join('\n\n'), sections: titles.map(title => ({ title, body: `这是${title}的测试原文。` })) } }));
  await page.goto('/reports/9001');
  await expect(page.getByRole('navigation', { name: '报告章节目录' }).getByRole('button')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: '个人画像', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /07\s*免责声明/ }).click();
  await expect(page.getByText('这是免责声明的测试原文。')).toBeVisible();
});

test('chapter entry carries a bounded original excerpt into an editable question', async ({ page }) => {
  const body = '这是原始章节中的依据与观察。'.repeat(300);
  const sections = [{ title: '核心观察', body }, ...report.sections.slice(1)];
  const original = sections.map(section => `### ${section.title}\n\n${section.body}`).join('\n\n');
  await page.route('**/api/conversations/9001/report', route => route.fulfill({ json: { ...report, content: original, sections } }));
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: question, task_context: context,
    profile: report.profile, messages: [{ id: 1, role: 'user', content: question }, { id: 2, role: 'assistant', content: original }] } }));
  await page.goto('/reports/9001');
  const link = page.getByRole('link', { name: '针对这一节提问', exact: true }).first();
  const url = new URL((await link.getAttribute('href'))!, 'http://127.0.0.1:3010');
  const draft = url.searchParams.get('question')!;
  expect(draft).toContain('最初保存的报告中的“核心观察”');
  expect(draft).toContain('引用报告原文：\n### 核心观察');
  expect(draft).toContain('这是原始章节中的依据与观察。');
  expect(draft.length).toBeLessThan(500);
  expect(url.href.length).toBeLessThan(8192);
  await link.click();
  await expect(page.getByRole('textbox', { name: '对话输入框' })).toHaveValue(draft);
});
