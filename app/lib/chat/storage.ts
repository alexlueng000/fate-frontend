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
    return raw ? (JSON.parse(raw) as Msg[]) : null;
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


export const ACTIVE_CONV_KEY = 'conversation_id'; // 如果你用的是别名，改这里
export const PAIPAN_KEY = 'paipan';                       // 你的 savePaipanLocal 用到的 key
export const BOOTSTRAP_KEY = 'bootstrap_reply';

export function clearChatStorage() {
  // sessionStorage
  try {
    sessionStorage.removeItem('conversation_id');
    // sessionStorage.removeItem(BOOTSTRAP_KEY);
  } catch {}

  // localStorage：删除活跃会话、命盘、以及以 conv:/chat: 前缀存的消息
  try {
    const toDel: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (
        k === ACTIVE_CONV_KEY ||
        k === PAIPAN_KEY ||
        k === BOOTSTRAP_KEY ||
        k.startsWith('conv:') ||   // 例如 conv:<conversation_id>
        k.startsWith('chat:')      // 如果你用了 chat: 前缀
      ) {
        toDel.push(k);
      }
    }
    toDel.forEach(k => localStorage.removeItem(k));
  } catch {}
}
