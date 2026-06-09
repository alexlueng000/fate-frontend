// app/lib/career-progress/api.ts
import { api } from '@/app/lib/api';
import type { CareerTaskContext } from '@/app/lib/tasks/career';

export type CareerProgressRecord = {
  id: number;
  task_id: string | null;
  task_context: CareerTaskContext;
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

function buildTaskId(task: CareerTaskContext): string {
  return `${task.mode}:${task.title}:${task.href}`.slice(0, 128);
}

async function parseError(response: Response, fallback: string): Promise<Error> {
  const error = await response.json().catch(() => null);
  return new Error(error?.detail || fallback);
}

export const careerProgressApi = {
  async getLatest(): Promise<CareerProgressRecord | null> {
    const response = await fetch(api('/career-progress/latest'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      throw await parseError(response, 'Failed to fetch career progress');
    }
    return response.json();
  },

  async saveProgress(task: CareerTaskContext, content: string): Promise<CareerProgressRecord> {
    const response = await fetch(api('/career-progress'), {
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
      throw await parseError(response, 'Failed to save career progress');
    }
    return response.json();
  },

  async scheduleReview(task: CareerTaskContext): Promise<CareerProgressRecord> {
    const response = await fetch(api('/career-progress/review'), {
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
      throw await parseError(response, 'Failed to schedule career review');
    }
    return response.json();
  },
};

