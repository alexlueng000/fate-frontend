// app/lib/relationship-progress/api.ts
import { api } from '@/app/lib/api';
import type { RelationshipTaskContext } from '@/app/lib/tasks/relationship';

export type RelationshipProgressRecord = {
  id: number;
  task_id: string | null;
  task_context: RelationshipTaskContext;
  content: string | null;
  review_due_at: string | null;
  created_at: string;
  updated_at: string;
};

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildTaskId(task: RelationshipTaskContext): string {
  return `${task.mode}:${task.title}:${task.href}`.slice(0, 128);
}

async function parseError(response: Response, fallback: string): Promise<Error> {
  const error = await response.json().catch(() => null);
  return new Error(error?.detail || fallback);
}

export const relationshipProgressApi = {
  async getLatest(): Promise<RelationshipProgressRecord | null> {
    const response = await fetch(api('/relationship-progress/latest'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      throw await parseError(response, 'Failed to fetch relationship progress');
    }
    return response.json();
  },

  async saveProgress(
    task: RelationshipTaskContext,
    content: string,
  ): Promise<RelationshipProgressRecord> {
    const response = await fetch(api('/relationship-progress'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({
        task_id: buildTaskId(task),
        task_context: task,
        content,
        review_due_at: task.reviewDueAt ?? null,
      }),
    });
    if (!response.ok) {
      throw await parseError(response, 'Failed to save relationship progress');
    }
    return response.json();
  },

  async scheduleReview(task: RelationshipTaskContext): Promise<RelationshipProgressRecord> {
    const response = await fetch(api('/relationship-progress/review'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({
        task_id: buildTaskId(task),
        task_context: task,
        review_due_at: task.reviewDueAt,
      }),
    });
    if (!response.ok) {
      throw await parseError(response, 'Failed to schedule relationship review');
    }
    return response.json();
  },
};
