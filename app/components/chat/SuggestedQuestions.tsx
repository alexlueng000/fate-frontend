'use client';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  loading?: boolean;
}

export function SuggestedQuestions({
  questions,
  onQuestionClick,
  loading = false,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs text-[var(--color-text-muted)] font-medium">
        猜你想问
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onQuestionClick(q)}
            disabled={loading}
            className="text-left px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
