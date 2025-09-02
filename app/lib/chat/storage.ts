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
