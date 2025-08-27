// lib/api/index.ts
export type Gender = '男' | '女';

export interface CalcPaipanResp {
  mingpan?: {
    four_pillars?: {
      year?: [string?, string?] | string[];
      month?: [string?, string?] | string[];
      day?: [string?, string?] | string[];
      hour?: [string?, string?] | string[];
    };
    dayun?: Array<{
      age: number;
      start_year: number;
      pillar: [string?, string?] | string[];
    }>;
  };
}

export interface FourPillarsArr {
  year: [string, string] | string[];
  month: [string, string] | string[];
  day: [string, string] | string[];
  hour: [string, string] | string[];
}
export interface DayunItemArr {
  age: number;
  start_year: number;
  pillar: [string, string] | string[];
}
export interface PaipanForChat {
  four_pillars: FourPillarsArr;
  dayun: DayunItemArr[];
}

export interface ChatStartReq {
  paipan: PaipanForChat;
  kb_index_dir?: string | null;
  kb_topk?: number;
  note?: string | null;
}
export interface ChatStartResp {
  conversation_id: string;
  reply: string;
}

export interface ChatSendReq {
  conversation_id: string;
  kb_topk?: number;
  message: string | null;
}
export interface ChatSendResp {
  conversation_id: string;
  reply: string;
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');

async function req<T>(path: string, init?: RequestInit, bearer?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function calcPaipan(payload: unknown, bearer?: string) {
  return req<CalcPaipanResp>('/bazi/calc_paipan', { method: 'POST', body: JSON.stringify(payload) }, bearer);
}
export function startChat(payload: ChatStartReq, bearer?: string) {
  return req<ChatStartResp>('/chat/start', { method: 'POST', body: JSON.stringify(payload) }, bearer);
}
export function sendChat(payload: ChatSendReq, bearer?: string) {
  return req<ChatSendResp>('/chat/send', { method: 'POST', body: JSON.stringify(payload) }, bearer);
}