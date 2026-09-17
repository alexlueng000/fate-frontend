import { previewUser } from './config';
import type { ConversationListItem } from '../history/api';
import type { Paipan } from '../chat/types';

// Deliberately fixed UI fixtures, not results calculated from the sample birthday.
export const previewChart: Paipan = {
  time_correction_method: 'none',
  warnings: ['回退提示演示：出生地解析失败，未应用经度修正，保留当地钟表时间。此处为固定示例。'],
  four_pillars: { year: ['庚', '午'], month: ['壬', '午'], day: ['甲', '寅'], hour: ['己', '巳'] },
  dayun: [
    { age: 7, start_year: 1997, pillar: ['癸', '未'] },
    { age: 17, start_year: 2007, pillar: ['甲', '申'] },
    { age: 27, start_year: 2017, pillar: ['乙', '酉'] },
    { age: 37, start_year: 2027, pillar: ['丙', '戌'] },
    { age: 47, start_year: 2037, pillar: ['丁', '亥'] },
  ],
};

export const previewReport = `### 个人画像

这是用于检查页面排版的固定示例，不是针对出生资料生成的真实解读。你可能更习惯先理解事情的来龙去脉，再决定是否投入。

### 性格特点

面对新任务时，你可能倾向于先搭建框架，再逐步补齐细节。可以回想最近一次合作，看看自己是否确实有这样的习惯。

### 做事方式

当目标不够清晰时，先确定一项可以验证的小成果，可能比同时推进很多方向更容易获得反馈。

### 人际与感情

表达自己的期待，也给对方解释的空间。例如，如果双方对安排有分歧，可以先把时间和责任说清楚。

### 行动建议

- 任务太多时：写下本周最重要的一件事。
- 选择困难时：列出已知条件与仍需核实的信息。
- 沟通受阻时：说明具体情境，再表达自己的需求。

### 三年关键节点

这里保留长文阅读示例。演示模式没有运行年份和大运计算，不提供实际年度判断。

### 免责声明

以上内容由传统文化AI生成，仅供娱乐参考。

本页为人工编写的本地演示样例，未调用 AI。`;

export const previewProfile = {
  ...previewUser.profile_brief, user_id: previewUser.id, calendar_type: 'solar', calendar: 'gregorian',
  bazi_chart: { mingpan: previewChart }, ai_report: previewReport,
};

export const previewReply = `### 本地演示回复

这是一段固定回复，用来检查消息显示、Markdown 和发送状态，不代表真实 AI 分析。

可以先把正在考虑的选择列出来，再比较工作内容、时间投入与成长空间。

- 哪些条件已经确定？
- 哪些信息还需要向对方确认？

演示消息只用于页面预览，不写入数据库，也不消耗额度。`;

export const previewConversations: ConversationListItem[] = [
  { id: 9001, title: '现在的工作方向适合继续深入吗？', created_at: '2026-09-16T03:00:00Z', updated_at: '2026-09-17T02:30:00Z', last_user_message: '现在的工作方向适合继续深入吗？', last_assistant_preview: '先区分你对工作内容的不适应，还是对成长空间的不确定，再决定要调整哪一部分。', bazi_summary: '庚午 壬午 甲寅 己巳' },
  { id: 9002, title: '怎样安排下一阶段的学习？', created_at: '2026-09-15T03:00:00Z', updated_at: '2026-09-16T06:00:00Z', last_user_message: '怎样安排下一阶段的学习？', last_assistant_preview: '先选择一个能在两周内完成的小项目，把学习转为具体反馈。', bazi_summary: '庚午 壬午 甲寅 己巳' },
];

export const previewOverview = {
  users: { total: 120, today: 3, this_week: 18, this_month: 43, active_7d: 27 },
  conversations: { total: 210, today: 8 }, messages: { total: 940, tokens_used: 52000 },
  feedbacks: { pending: 4 },
  rates: { new_user_activation: 80, first_read_followup: 30, retention_7d: 25, paid_conversion: 5,
    samples: { new_users: 40, interpreted_conversations: 200, retention_cohort: 20, paid_users: 6 } },
};
