import { Msg, Paipan } from './types';

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
    // 直接返回消息，不进行额外的 normalize 处理
    // 因为消息在保存前已经经过了 normalize 处理
    return messages;
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
export function clearActiveConversationId() {
  try {
    localStorage.removeItem(LS_ACTIVE);
    sessionStorage.removeItem('conversation_id');
  } catch {}
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

/**
 * 修复损坏的对话数据（清理重复的 # 号）
 * 用于修复因重复调用 normalizeMarkdown 导致的 "### ### ###" 问题
 */
export function repairCorruptedConversations() {
  try {
    let repairedCount = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(LS_CONV_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;

          const messages = JSON.parse(raw) as Msg[];
          let hasCorruption = false;

          const repairedMessages = messages.map(msg => {
            if (msg.role === 'assistant' && msg.content) {
              // 检测是否有重复的 # 号（如 "### ### ###"）
              const corrupted = /^#{3,}\s+#{3,}/gm.test(msg.content);
              if (corrupted) {
                hasCorruption = true;
                // 清理重复的 # 号：将 "### ### ### 标题" 替换为 "### 标题"
                const cleaned = msg.content.replace(/^(#{3,}(?:\s+#{3,})+)\s+/gm, '### ');
                return { ...msg, content: cleaned };
              }
            }
            return msg;
          });

          if (hasCorruption) {
            localStorage.setItem(key, JSON.stringify(repairedMessages));
            repairedCount++;
          }
        } catch (e) {
          console.warn('Failed to repair conversation:', key, e);
        }
      }
    });

    return repairedCount;
  } catch (e) {
    console.error('Failed to repair corrupted conversations:', e);
    return 0;
  }
}
