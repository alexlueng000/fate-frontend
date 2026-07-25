import { normalizeMarkdown, type Msg } from '@/app/lib/chat/types';

export interface SuggestedQuestions {
  questions: string[];
  cleanedContent: string; // 移除标记后的内容
}

export type StoredChatMessage = {
  id?: number;
  role: string;
  content: string;
};

const REVERSE_QUESTION_PREFIX =
  /^(?:请问)?(?:您|你)?(?:目前|当前|平时|现在)?(?:是否|有没有|有无|从事|需要提供|能否说明)/;

function contextualFallbackQuestions(content: string): string[] {
  if (/健康|身体|脾胃|肝|肺|睡眠|作息|情绪|运动|饮食|调理/.test(content)) {
    return [
      '从命盘倾向看，我应重点关注哪些生活习惯？',
      '未来三年我的身心状态有哪些阶段变化？',
      '我的作息与情绪管理可以怎样调整？',
      '哪些日常方式更有助于我保持稳定状态？',
    ];
  }
  if (/事业|工作|职业|岗位|行业|职场|学习|证书|技能/.test(content)) {
    return [
      '未来三年我的事业发展重点是什么？',
      '当前阶段我更适合深耕还是转换方向？',
      '我的哪些能力更值得持续投入培养？',
      '我该怎样把现有经验转化为长期优势？',
    ];
  }
  if (/感情|婚姻|关系|伴侣|沟通|正缘/.test(content)) {
    return [
      '我的沟通方式在关系中有哪些优势？',
      '未来三年我的关系发展节奏如何？',
      '我在亲密关系中应注意哪些互动模式？',
      '什么样的相处方式更适合我的特点？',
    ];
  }
  return [
    '未来三年我最值得关注的发展重点是什么？',
    '当前阶段我的优势适合用在哪些方向？',
    '我需要注意哪些容易忽略的行动节奏？',
    '怎样安排下一步更符合我的命盘特点？',
  ];
}

function ensureUserPerspective(questions: string[], content: string): string[] {
  const valid = questions.filter((question) => {
    const compact = question.replace(/\s+/g, '');
    return (
      compact.length > 0 &&
      !REVERSE_QUESTION_PREFIX.test(compact) &&
      !/病史|症状|疾病的预防|中医调理计划|具体岗位|哪个行业/.test(compact)
    );
  });

  const result = [...valid];
  for (const fallback of contextualFallbackQuestions(content)) {
    if (result.length >= 4) break;
    if (!result.includes(fallback)) result.push(fallback);
  }
  return result.slice(0, 4);
}

export function parseSuggestedQuestions(content: string): SuggestedQuestions {
  // 模型偶尔会输出全角/长横线；协议解析时统一按“三个横线”处理，
  // 但不改写正文中的普通连接号。
  const markerDash = '[-—–－]';

  // 支持多种格式变体
  const patterns = [
    // 完整协议；允许模型在标记两侧意外添加少量空格。
    new RegExp(
      `${markerDash}{3}\\s*SUGGESTED_QUESTIONS\\s*${markerDash}{3}` +
      `([\\s\\S]*?)` +
      `${markerDash}{3}\\s*END_SUGGESTED_QUESTIONS\\s*${markerDash}{3}`,
      'i',
    ),
    /【推荐问题】([\s\S]*?)【结束】/,
    /\[建议问题\]([\s\S]*?)\[\/建议问题\]/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const questionsText = match[1].trim();
      const parsedQuestions = questionsText
        .split('\n')
        .map(line => line.replace(/^\d+[.、．]\s*/, '').trim())
        .filter(q => q.length > 0 && q.length <= 50)
        .slice(0, 4); // 过滤异常长度

      const cleanedContent = content.replace(pattern, '').trim();
      const questions = ensureUserPerspective(parsedQuestions, cleanedContent);
      return { questions, cleanedContent };
    }
  }

  // 流被上游截断时，结束标记可能缺失。追问协议位于回复末尾，
  // 因此仍可安全地从开始标记解析到 EOF，避免整组按钮消失。
  const unterminated = content.match(
    new RegExp(
      `${markerDash}{3}\\s*SUGGESTED_QUESTIONS\\s*${markerDash}{3}([\\s\\S]*)$`,
      'i',
    ),
  );
  if (unterminated) {
    const parsedQuestions = unterminated[1]
      .trim()
      .split('\n')
      .map(line => line.replace(/^\d+[.、．]\s*/, '').trim())
      .filter(q => q.length > 0 && q.length <= 50)
      .slice(0, 4);
    const cleanedContent = content.slice(0, unterminated.index).trim();
    const questions = ensureUserPerspective(parsedQuestions, cleanedContent);

    return {
      questions,
      cleanedContent,
    };
  }

  return { questions: [], cleanedContent: content };
}

export function restoreStoredMessage(message: StoredChatMessage): Msg {
  const role = message.role as 'user' | 'assistant';
  const meta = message.id ? { messageId: message.id } : undefined;

  if (role !== 'assistant') {
    return {
      role,
      content: message.content,
      meta,
    };
  }

  const { questions, cleanedContent } = parseSuggestedQuestions(message.content || '');
  return {
    role,
    content: normalizeMarkdown(cleanedContent),
    meta,
    suggestedQuestions: questions.length > 0 ? questions : undefined,
  };
}
