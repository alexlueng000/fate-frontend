import type { ConversationListItem, HistoryType } from '@/app/lib/history/api';

export function conversationHref(item: ConversationListItem, type: HistoryType) {
  return type === 'bazi' ? `/chat?conv_id=${item.id}` : `/liuyao?conv_id=${item.id}`;
}

export function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

export function previewText(item: ConversationListItem, fallback: string) {
  return item.last_user_message || item.last_assistant_preview || fallback;
}

export function displayTitle(item: ConversationListItem, type: HistoryType) {
  if (type === 'bazi') return item.bazi_summary ? `八字 · ${item.bazi_summary}` : item.title || '八字解读';
  return item.hexagram?.main_gua ? `六爻 · ${item.hexagram.main_gua}` : item.title || '六爻问事';
}
