export interface SuggestedQuestions {
  questions: string[];
  cleanedContent: string; // 移除标记后的内容
}

export function parseSuggestedQuestions(content: string): SuggestedQuestions {
  // 支持多种格式变体
  const patterns = [
    /---SUGGESTED_QUESTIONS---([\s\S]*?)---END_SUGGESTED_QUESTIONS---/,
    /【推荐问题】([\s\S]*?)【结束】/,
    /\[建议问题\]([\s\S]*?)\[\/建议问题\]/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const questionsText = match[1].trim();
      const questions = questionsText
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 0 && q.length <= 50); // 过滤异常长度

      const cleanedContent = content.replace(pattern, '').trim();
      return { questions, cleanedContent };
    }
  }

  return { questions: [], cleanedContent: content };
}
