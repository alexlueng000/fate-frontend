'use client';

import { useState, useEffect } from 'react';

// 本卦：风火家人（坎上离下，简化示例）
const BEN_GUA = [1, 1, 0, 1, 1, 1]; // 1=阳, 0=阴，从下到上
const BIAN_GUA = [1, 1, 0, 0, 1, 1]; // 第4爻变爻

const GUA_NAME_BEN = '风火家人';
const GUA_NAME_BIAN = '天火同人';

function Yao({ yang, moving, revealed }: { yang: boolean; moving?: boolean; revealed: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-1 transition-all duration-500 ${revealed ? 'opacity-100' : 'opacity-0 translate-y-2'}`}>
      {yang ? (
        <div className={`h-2 rounded-full bg-current ${moving ? 'opacity-70' : ''}`} style={{ width: '100%' }} />
      ) : (
        <div className="flex gap-1 w-full">
          <div className="flex-1 h-2 rounded-full bg-current" />
          <div className="w-2" />
          <div className="flex-1 h-2 rounded-full bg-current" />
        </div>
      )}
    </div>
  );
}

export default function HexagramPreview() {
  const [phase, setPhase] = useState<'ben' | 'bian'>('ben');
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 6; i++) {
      timers.push(setTimeout(() => setRevealedCount(i + 1), i * 200 + 300));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p === 'ben' ? 'bian' : 'ben')), 3500);
    return () => clearTimeout(t);
  }, [phase]);

  const gua = phase === 'ben' ? BEN_GUA : BIAN_GUA;
  const guaName = phase === 'ben' ? GUA_NAME_BEN : GUA_NAME_BIAN;
  const movingLine = 3; // 第4爻（0-indexed: 3）为动爻

  return (
    <div className="space-y-4">
      <div className="text-xs text-[var(--color-text-muted)] text-center mb-2">卦象演示（示例）</div>

      {/* 卦象 */}
      <div className="flex gap-6 justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-28 space-y-2 p-3 rounded-xl transition-all duration-500"
            style={{
              color: phase === 'ben' ? 'var(--color-gold-dark)' : 'var(--color-mist-deep)',
              background: phase === 'ben' ? 'rgba(176,138,87,0.1)' : 'rgba(167,179,174,0.1)',
            }}
          >
            {[...gua].reverse().map((yang, i) => (
              <Yao
                key={i}
                yang={yang === 1}
                moving={phase === 'ben' && (5 - i) === movingLine}
                revealed={revealedCount > i}
              />
            ))}
          </div>
          <div className="text-xs font-medium" style={{ color: phase === 'ben' ? 'var(--color-gold-dark)' : 'var(--color-mist-deep)' }}>
            {guaName}
          </div>
          <div className="text-xs text-[var(--color-text-hint)]">
            {phase === 'ben' ? '本卦' : '变卦'}
          </div>
        </div>

        {phase === 'bian' && (
          <div className="flex items-center text-[var(--color-text-hint)] text-xl self-center -mt-6">→</div>
        )}
      </div>

      {/* 解读摘要 */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-deep)] space-y-2">
        <div className="text-xs font-medium text-[var(--color-text-primary)]">
          {phase === 'ben' ? '卦象分析' : '变卦提示'}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {phase === 'ben'
            ? '此卦主"家"，问事结果以内部协调为先，宜稳不宜急，第四爻动，需关注关键变数。'
            : '变为天火同人，格局开阔，原有阻碍趋于化解，合作与沟通将带来转机。'}
        </p>
      </div>

      {/* 行动建议 */}
      <div className="flex gap-2">
        {['趋势向好', '3-7日', '主动沟通'].map((tag) => (
          <span
            key={tag}
            className="flex-1 text-center px-2 py-1 rounded text-xs"
            style={{
              background: 'rgba(176,138,87,0.12)',
              color: 'var(--color-gold-dark)',
              border: '1px solid rgba(176,138,87,0.25)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
