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
      const questions = questionsText
        .split('\n')
        .map(line => line.replace(/^\d+[.、．]\s*/, '').trim())
        .filter(q => q.length > 0 && q.length <= 50)
        .slice(0, 4); // 过滤异常长度

      const cleanedContent = content.replace(pattern, '').trim();
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
    const questions = unterminated[1]
      .trim()
      .split('\n')
      .map(line => line.replace(/^\d+[.、．]\s*/, '').trim())
      .filter(q => q.length > 0 && q.length <= 50)
      .slice(0, 4);

    return {
      questions,
      cleanedContent: content.slice(0, unterminated.index).trim(),
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
