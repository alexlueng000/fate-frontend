import { Msg, Paipan, normalizeMarkdown } from './types';

const LS_ACTIVE = 'chat:active';
const LS_CONV_PREFIX = 'chat:conv:'; // + conversation_id
const LS_LAST_PAIPAN = 'chat:last_paipan';

export function saveConversation(conversationId: string, messages: Msg[]) {
  try {
    localStorage.setItem(`${LS_CONV_PREFIX}${conversationId}`, JSON.stringify(messages));
    localStorage.setItem(LS_ACTIVE, conversationId);
  } catch {}
}
export function loadConversation(conversationId: string): Msg[] | null {
  try {
    const raw = localStorage.getItem(`${LS_CONV_PREFIX}${conversationId}`);
    if (!raw) return null;

    const messages = JSON.parse(raw) as Msg[];
    // 对所有 assistant 消息的内容进行 normalize 处理，确保旧数据也能正确显示
    return messages.map(msg => {
      if (msg.role === 'assistant' && msg.content && msg.meta?.kind !== 'intro') {
        return { ...msg, content: normalizeMarkdown(msg.content) };
      }
      return msg;
    });
  } catch {
    return null;
  }
}
export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE);
  } catch {
    return null;
  }
}
export function savePaipanLocal(p: Paipan) {
  try {
    localStorage.setItem(LS_LAST_PAIPAN, JSON.stringify(p));
  } catch {}
}
export function loadPaipanLocal(): Paipan | null {
  try {
    const raw = localStorage.getItem(LS_LAST_PAIPAN);
    return raw ? (JSON.parse(raw) as Paipan) : null;
  } catch {
    return null;
  }
}

export function clearAllChatData() {
  try {
    // 清理活跃会话 ID
    localStorage.removeItem(LS_ACTIVE);
    // 清理排盘数据
    localStorage.removeItem(LS_LAST_PAIPAN);
    // 清理所有会话数据
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(LS_CONV_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    // 清理 sessionStorage 中的会话 ID
    sessionStorage.removeItem('conversation_id');
  } catch {}
}
