export type RelationshipTaskMode = 'bazi' | 'liuyao';

export type RelationshipTaskDraft = {
  mode: RelationshipTaskMode;
  topic: string;
  currentSituation: string;
  timeframe: string;
  options: string;
};

export type RelationshipTaskContext = {
  taskType: 'relationship';
  mode: RelationshipTaskMode;
  title: string;
  summary: string;
  nextAction: string;
  followUpHint: string;
  href: string;
  updatedAt: string;
  lastProgress?: string;
  lastProgressAt?: string;
  reviewDueAt?: string;
  progressNotes?: RelationshipTaskProgress[];
};

export type RelationshipTaskProgress = {
  content: string;
  createdAt: string;
};

const RELATIONSHIP_TASK_KEY = 'task:relationship:latest';
const RELATIONSHIP_PENDING_BAZI_PROMPT_KEY = 'task:relationship:pending_bazi_prompt';

function clean(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function withFallback(value: string, fallback: string) {
  const cleaned = clean(value);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function buildRelationshipBaziPrompt(draft: RelationshipTaskDraft) {
  const topic = withFallback(draft.topic, '我正在看感情关系里的长期模式');
  const currentSituation = withFallback(draft.currentSituation, '目前还没有补充具体背景');
  const timeframe = withFallback(draft.timeframe, '未来 30 天');
  const options = withFallback(draft.options, '暂无明确对象或选择，先看长期关系模式');

  return [
    '我正在处理一个感情关系任务，请基于我的八字来分析，不要脱离八字体系泛泛建议。',
    '',
    `我的问题：${topic}`,
    `当前情况：${currentSituation}`,
    `正在比较或纠结的关系/选择：${options}`,
    `我希望重点看：${timeframe}`,
    '',
    '请按以下结构输出：',
    '1. 命局里的感情模式：用白话说明我在关系中的表达方式、依恋倾向、容易被什么人吸引。',
    '2. 当前阶段节奏：结合大运、流年或流月，看现在更适合主动推进、稳定观察、修复沟通还是先拉开距离。',
    '3. 关系里的重复倾向：指出容易误判、过度投入、逃避或消耗的地方，不要吓人，不说绝对话。',
    '4. 未来 30 天行动建议：给 3 个具体、低压力、可执行的小动作，帮助我看清关系而不是替我做决定。',
    '5. 复盘点：告诉我什么时候回来复盘，以及如果出现复合、表白、见家长、冷战或分手等具体事件，应该如何转去六爻判断。',
  ].join('\n');
}

export function buildRelationshipLiuyaoQuestion(draft: RelationshipTaskDraft) {
  const topic = withFallback(draft.topic, '我正在判断一个具体的感情关系选择');
  const currentSituation = withFallback(draft.currentSituation, '目前还没有补充具体背景');
  const timeframe = withFallback(draft.timeframe, '近期');
  const options = withFallback(draft.options, '这段关系或这个具体选择');

  return [
    `${topic}。`,
    `具体关系/选择：${options}。`,
    `当前情况：${currentSituation}。`,
    `重点观察时间：${timeframe}。`,
    '请帮我看这件事现在能不能推进、对方态度和风险在哪里、接下来应该怎么做，以及什么时候回来复盘。',
  ].join('');
}

export function buildRelationshipTaskHref(draft: RelationshipTaskDraft) {
  if (draft.mode === 'bazi') {
    return '/panel?task=relationship&mode=bazi&auto=1';
  }

  const question = buildRelationshipLiuyaoQuestion(draft);
  return `/liuyao?task=relationship&mode=liuyao&scenario=relationship&question=${encodeURIComponent(question)}`;
}

export function createRelationshipTaskContext(draft: RelationshipTaskDraft): RelationshipTaskContext {
  const topic = withFallback(draft.topic, '感情关系');
  const modeLabel = draft.mode === 'bazi' ? '长期感情模式' : '具体感情关系';

  return {
    taskType: 'relationship',
    mode: draft.mode,
    title: `${modeLabel}：${topic}`,
    summary: draft.mode === 'bazi'
      ? '正在用八字看长期关系模式、当前节奏和未来 30 天行动。'
      : '正在用六爻判断具体关系、对方态度、风险点和观察时间。',
    nextAction: draft.mode === 'bazi'
      ? '先生成感情模式分析，再根据结论选择一个 7 天观察动作。'
      : '先完成六爻排盘并开启解读，再记录需要观察的关系信号。',
    followUpHint: draft.mode === 'bazi'
      ? '如果出现复合、表白、冷战、分手或见家长等具体节点，可以回到六爻判断。'
      : '按解读里的观察时间点回来复盘，避免一次定死关系。',
    href: buildRelationshipTaskHref(draft),
    updatedAt: new Date().toISOString(),
  };
}

export function saveRelationshipTaskContext(context: RelationshipTaskContext) {
  try {
    localStorage.setItem(RELATIONSHIP_TASK_KEY, JSON.stringify(context));
  } catch {}
}

export function recordRelationshipTaskProgress(
  context: RelationshipTaskContext,
  content: string,
): RelationshipTaskContext {
  const cleaned = clean(content);
  if (!cleaned) return context;

  const now = new Date().toISOString();
  const progress: RelationshipTaskProgress = {
    content: cleaned,
    createdAt: now,
  };
  const next: RelationshipTaskContext = {
    ...context,
    lastProgress: cleaned,
    lastProgressAt: now,
    progressNotes: [progress, ...(context.progressNotes ?? [])].slice(0, 5),
    updatedAt: now,
  };
  saveRelationshipTaskContext(next);
  return next;
}

export function scheduleRelationshipTaskReview(
  context: RelationshipTaskContext,
  days = 3,
): RelationshipTaskContext {
  const due = new Date();
  due.setDate(due.getDate() + days);
  const next: RelationshipTaskContext = {
    ...context,
    reviewDueAt: due.toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveRelationshipTaskContext(next);
  return next;
}

export function savePendingRelationshipBaziPrompt(prompt: string) {
  try {
    sessionStorage.setItem(RELATIONSHIP_PENDING_BAZI_PROMPT_KEY, prompt);
  } catch {}
}

export function takePendingRelationshipBaziPrompt(): string | null {
  try {
    const prompt = sessionStorage.getItem(RELATIONSHIP_PENDING_BAZI_PROMPT_KEY);
    sessionStorage.removeItem(RELATIONSHIP_PENDING_BAZI_PROMPT_KEY);
    return prompt && prompt.trim().length > 0 ? prompt : null;
  } catch {
    return null;
  }
}

export function loadRelationshipTaskContext(): RelationshipTaskContext | null {
  try {
    const raw = localStorage.getItem(RELATIONSHIP_TASK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RelationshipTaskContext>;
    if (
      parsed.taskType !== 'relationship' ||
      (parsed.mode !== 'bazi' && parsed.mode !== 'liuyao') ||
      typeof parsed.title !== 'string' ||
      typeof parsed.href !== 'string'
    ) {
      return null;
    }
    return parsed as RelationshipTaskContext;
  } catch {
    return null;
  }
}
