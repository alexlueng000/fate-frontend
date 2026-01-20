'use client';

import { useState } from 'react';

interface KnowledgeItem {
  term: string;
  explanation: string;
  category?: string;
}

interface KnowledgePanelProps {
  items?: KnowledgeItem[];
}

const defaultItems: KnowledgeItem[] = [
  { term: '日主', explanation: '八字中日柱的天干，代表命主本人，是分析八字的核心。', category: '基础概念' },
  { term: '五行', explanation: '金、木、水、火、土五种元素，相生相克，构成命理分析的基础。', category: '基础概念' },
  { term: '大运', explanation: '每十年一个阶段的运势周期，由月柱推算而来。', category: '运势周期' },
  { term: '流年', explanation: '每一年的运势，与大运结合分析当年吉凶。', category: '运势周期' },
];

export default function KnowledgePanel({ items = defaultItems }: KnowledgePanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = [...new Set(items.map((i) => i.category || '其他'))];

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-[var(--color-gold)] mb-3">术语解释</h3>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="text-xs text-[var(--color-text-muted)] mb-2">{cat}</div>
            <div className="space-y-2">
              {items
                .filter((i) => (i.category || '其他') === cat)
                .map((item) => (
                  <div
                    key={item.term}
                    className="bg-[var(--color-bg-elevated)] rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpanded(expanded === item.term ? null : item.term)}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {item.term}
                      </span>
                      <svg
                        className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expanded === item.term ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expanded === item.term && (
                      <div className="px-3 pb-3 text-sm text-[var(--color-text-secondary)] animate-fade-in">
                        {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
