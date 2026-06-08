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
  const timeframe = withFallback(draft.timeframe, '未来 30 天');
  const options = withFallback(draft.options, '暂无明确选项，先看长期方向');

  return [
    '我正在处理一个事业选择任务，请基于我的八字来分析，不要脱离八字体系泛泛建议。',
    '',
    `我的问题：${topic}`,
    `当前情况：${currentSituation}`,
    `正在比较或纠结的选项：${options}`,
    `我希望重点看：${timeframe}`,
    '',
    '请按以下结构输出：',
    '1. 命局里的事业特质：用白话说明我更适合的工作方式、岗位类型或能力方向。',
    '2. 当前阶段节奏：结合大运、流年或流月，看现在更适合进取、稳定、转换还是蓄力。',
    '3. 需要避免的决策倾向：不要吓人，不说绝对话。',
    '4. 未来 30 天行动建议：给 3 个具体、低压力、可执行的小动作。',
    '5. 复盘点：告诉我什么时候回来复盘，以及如果出现具体 offer 或合作，应该如何转去六爻判断。',
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
  };
}

export function saveCareerTaskContext(context: CareerTaskContext) {
  try {
    localStorage.setItem(CAREER_TASK_KEY, JSON.stringify(context));
  } catch {}
}

export function savePendingCareerBaziPrompt(prompt: string) {
  try {
    sessionStorage.setItem(CAREER_PENDING_BAZI_PROMPT_KEY, prompt);
  } catch {}
}

export function takePendingCareerBaziPrompt(): string | null {
  try {
    const prompt = sessionStorage.getItem(CAREER_PENDING_BAZI_PROMPT_KEY);
    sessionStorage.removeItem(CAREER_PENDING_BAZI_PROMPT_KEY);
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
