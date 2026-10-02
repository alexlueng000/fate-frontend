// UI contract only: provider and profile endpoints are replaced with fixtures.
import { test, expect } from '@playwright/test';

const titles = ['个人画像', '性格特点', '做事方式', '人际与感情', '行动建议', '三年关键节点', '免责声明'];
// Actual backend normalization adds WORD JOINER to heading lines.
const report = titles.map(title => `### ${title}\u2060\n这是${title}的测试原文。`).join('\n');
const profile = { id: 90001, gender: 'male', birth_date: '1993-03-09', birth_time: '07:00:00', birth_location: '上海', calendar_type: 'solar',
  bazi_chart: { mingpan: { four_pillars: { year: ['甲', '子'], month: ['丙', '寅'], day: ['戊', '辰'], hour: ['庚', '午'] }, dayun: [] } },
};

test('personal report is saved by server and resumes chapter questions after reload', async ({ page }, info) => {
  let saved = false;
  let generated = 0;
  let askedConversation = '';
  let recalculated = 0;
  await page.route('**/api/profile/me', route => route.fulfill({ json: { ...profile, ai_report: saved ? report : null, report_conversation_id: saved ? 9001 : null } }));
  await page.route('**/api/bazi/calc_paipan', route => { recalculated++; return route.fulfill({ json: {} }); });
  await page.route('**/api/chat/start', route => {
    generated++; saved = true;
    return route.fulfill({ contentType: 'text/event-stream', body: `data: {"meta":{"conversation_id":"bazi_conv_9001"}}\n\ndata: ${JSON.stringify({ text: report, replace: true })}\n\ndata: {"meta":{"message_id":2}}\n\ndata: [DONE]\n\n` });
  });
  await page.route('**/api/chat', route => {
    askedConversation = route.request().postDataJSON().conversation_id;
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"针对本节的测试追问回复。","replace":true}\n\ndata: [DONE]\n\n' });
  });
  await page.route('**/api/conversations/9001', route => route.fulfill({ json: { id: 9001, type: 'bazi', title: '个人报告',
    messages: [{ id: 1, role: 'user', content: '我的命盘信息如下：报告请求' }, { id: 2, role: 'assistant', content: report }], profile } }));
  await page.goto('/report');
  await expect(page.getByRole('heading', { name: '阅读目录', exact: true })).toBeVisible();
  expect(generated).toBe(1); expect(recalculated).toBe(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: '阅读目录', exact: true })).toBeVisible();
  expect(generated).toBe(1);
  await page.getByRole('button', { name: '针对这一节提问', exact: true }).first().click();
  await page.getByRole('button', { name: '发送追问', exact: true }).click();
  await expect(page.getByText('针对本节的测试追问回复。')).toBeVisible();
  expect(askedConversation).toBe('bazi_conv_9001');
  await page.getByRole('heading', { name: '阅读目录', exact: true }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/fate-personal-report-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: '自己写问题', exact: true }).click();
  await expect(page).toHaveURL(/\/chat\?conv_id=9001$/);
  await expect(page.getByRole('link', { name: '查看完整报告' })).toHaveAttribute('href', '/reports/9001');
  expect(generated).toBe(1);
});

test('interrupted personal report never automatically generates twice', async ({ page }) => {
  let generated = 0;
  let recovered = false;
  await page.route('**/api/profile/me', route => route.fulfill({ json: { ...profile, ai_report: recovered ? report : null, report_conversation_id: recovered ? 9001 : null } }));
  await page.route('**/api/chat/start', route => {
    generated++;
    return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"text":"一段未完成的报告。","replace":true}\n\n' });
  });
  await page.goto('/report');
  await expect(page.getByRole('button', { name: '重新加载报告' })).toBeVisible();
  await expect(page.getByText('一段未完成的报告。')).toHaveCount(0);
  expect(generated).toBe(1);
  recovered = true;
  await page.getByRole('button', { name: '重新加载报告' }).click();
  await expect(page.getByRole('heading', { name: '阅读目录', exact: true })).toBeVisible();
  expect(generated).toBe(1);
});

test('an unlinked legacy report stays readable without inventing a follow-up conversation', async ({ page }) => {
  await page.route('**/api/profile/me', route => route.fulfill({ json: { ...profile, ai_report: report, report_conversation_id: null } }));
  await page.goto('/report');
  await expect(page.getByRole('navigation', { name: '报告章节目录' }).getByRole('button')).toHaveCount(7);
  await expect(page.getByRole('button', { name: '自己写问题', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '针对这一节提问', exact: true }).first().click();
  await expect(page.getByRole('button', { name: '发送追问', exact: true })).toBeDisabled();
  await expect(page.getByText(/没有可核实的关联会话/)).toBeVisible();
});
