export type CareerTaskMode = 'bazi' | 'liuyao';

export type CareerTaskDraft = {
  mode: CareerTaskMode;
  topic: string;
  currentSituation: string;
  timeframe: string;
  options: string;
};

export type CareerTaskContext = {
  taskType: 'career';
  mode: CareerTaskMode;
  title: string;
  summary: string;
  nextAction: string;
  followUpHint: string;
  href: string;
  updatedAt: string;
  lastProgress?: string;
  lastProgressAt?: string;
  reviewDueAt?: string;
  progressNotes?: CareerTaskProgress[];
  /** Explicit user inputs only; never derived from an assistant summary. */
  facts?: Pick<CareerTaskDraft, 'topic' | 'currentSituation' | 'options' | 'timeframe'>;
};

export type CareerTaskProgress = {
  content: string;
  createdAt: string;
};

const CAREER_TASK_KEY = 'task:career:latest';
const CAREER_PENDING_BAZI_PROMPT_KEY = 'task:career:pending_bazi_prompt';

function clean(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function withFallback(value: string, fallback: string) {
  const cleaned = clean(value);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function buildCareerBaziPrompt(draft: CareerTaskDraft) {
  const topic = withFallback(draft.topic, '我正在看工作或事业方向');
  const currentSituation = withFallback(draft.currentSituation, '目前还没有补充具体背景');
  const timeframe = withFallback(draft.timeframe, '尚未指定，请在需要时向我确认');
  const options = withFallback(draft.options, '暂无明确选项，先看长期方向');

  return [
    '我正在处理一个事业选择任务，请基于我的八字来分析，不要脱离八字体系泛泛建议。',
    '',
    `我的问题：${topic}`,
    `当前情况：${currentSituation}`,
    `正在比较或纠结的选项：${options}`,
    `我希望重点看：${timeframe}`,
    '',
    '如果缺少作答所必需的信息，请先澄清；否则首次解读请使用以下三级标题：',
    '### 核心观察：简明说明传统文化视角下的观察，不承诺结果。',
    '### 分析依据：区分命盘信息、传统解释与我提供的现实事实；不要编造未提供的背景。',
    '### 现实建议：提供 1–3 个可执行动作和复盘条件，尊重我指定的时间范围。',
    '后续追问直接回答，不重复完整报告。',
  ].join('\n');
}

export function buildCareerLiuyaoQuestion(draft: CareerTaskDraft) {
  const topic = withFallback(draft.topic, '我正在判断一个具体的工作或事业选择');
  const currentSituation = withFallback(draft.currentSituation, '目前还没有补充具体背景');
  const timeframe = withFallback(draft.timeframe, '近期');
  const options = withFallback(draft.options, '这个具体选择');

  return [
    `${topic}。`,
    `具体选择：${options}。`,
    `当前情况：${currentSituation}。`,
    `重点观察时间：${timeframe}。`,
    '请帮我看这件事现在能不能推进、风险在哪里、接下来应该怎么做，以及什么时候回来复盘。',
  ].join('');
}

export function buildCareerTaskHref(draft: CareerTaskDraft) {
  if (draft.mode === 'bazi') {
    return '/panel?task=career&mode=bazi&auto=1';
  }

  const question = buildCareerLiuyaoQuestion(draft);
  return `/liuyao?task=career&mode=liuyao&scenario=career&question=${encodeURIComponent(question)}`;
}

export function createCareerTaskContext(draft: CareerTaskDraft): CareerTaskContext {
  const topic = withFallback(draft.topic, '事业选择');
  const modeLabel = draft.mode === 'bazi' ? '长期事业方向' : '具体事业选择';

  return {
    taskType: 'career',
    mode: draft.mode,
    title: `${modeLabel}：${topic}`,
    summary: draft.mode === 'bazi'
      ? '正在用八字看长期方向、阶段节奏和未来 30 天行动。'
      : '正在用六爻判断具体事项、风险点和观察时间。',
    nextAction: draft.mode === 'bazi'
      ? '先生成事业阶段分析，再根据结论选择一个 7 天行动。'
      : '先完成六爻排盘并开启解读，再记录需要观察的信号。',
    followUpHint: draft.mode === 'bazi'
      ? '如果出现具体 offer、合作或跳槽窗口，可以回到六爻判断。'
      : '按解读里的观察时间点回来复盘，避免一次定死。',
    href: buildCareerTaskHref(draft),
    updatedAt: new Date().toISOString(),
    facts: { topic: clean(draft.topic), currentSituation: clean(draft.currentSituation), options: clean(draft.options), timeframe: clean(draft.timeframe) },
  };
}

export function saveCareerTaskContext(context: CareerTaskContext) {
  try {
    localStorage.setItem(CAREER_TASK_KEY, JSON.stringify(context));
  } catch {}
}

export function recordCareerTaskProgress(context: CareerTaskContext, content: string): CareerTaskContext {
  const cleaned = clean(content);
  if (!cleaned) return context;

  const now = new Date().toISOString();
  const progress: CareerTaskProgress = {
    content: cleaned,
    createdAt: now,
  };
  const next: CareerTaskContext = {
    ...context,
    lastProgress: cleaned,
    lastProgressAt: now,
    progressNotes: [progress, ...(context.progressNotes ?? [])].slice(0, 5),
    updatedAt: now,
  };
  saveCareerTaskContext(next);
  return next;
}

export function scheduleCareerTaskReview(context: CareerTaskContext, days = 3): CareerTaskContext {
  const due = new Date();
  due.setDate(due.getDate() + days);
  const next: CareerTaskContext = {
    ...context,
    reviewDueAt: due.toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveCareerTaskContext(next);
  return next;
}

export function savePendingCareerBaziPrompt(prompt: string) {
  try {
    sessionStorage.setItem(CAREER_PENDING_BAZI_PROMPT_KEY, prompt);
  } catch {}
}

export function clearPendingCareerBaziPrompt() {
  try { sessionStorage.removeItem(CAREER_PENDING_BAZI_PROMPT_KEY); } catch {}
}

export function takePendingCareerBaziPrompt(): string | null {
  try {
    const prompt = sessionStorage.getItem(CAREER_PENDING_BAZI_PROMPT_KEY);
    return prompt && prompt.trim().length > 0 ? prompt : null;
  } catch {
    return null;
  }
}

export function loadCareerTaskContext(): CareerTaskContext | null {
  try {
    const raw = localStorage.getItem(CAREER_TASK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CareerTaskContext>;
    if (
      parsed.taskType !== 'career' ||
      (parsed.mode !== 'bazi' && parsed.mode !== 'liuyao') ||
      typeof parsed.title !== 'string' ||
      typeof parsed.href !== 'string'
    ) {
      return null;
    }
    return parsed as CareerTaskContext;
  } catch {
    return null;
  }
}
