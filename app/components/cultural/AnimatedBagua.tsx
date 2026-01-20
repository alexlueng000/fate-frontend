'use client';

export default function AnimatedBagua({ size = 200, className = '' }: { size?: number; className?: string }) {
  const trigrams = [
    { name: '乾', lines: [1, 1, 1] },
    { name: '兑', lines: [1, 1, 0] },
    { name: '离', lines: [1, 0, 1] },
    { name: '震', lines: [1, 0, 0] },
    { name: '巽', lines: [0, 1, 1] },
    { name: '坎', lines: [0, 1, 0] },
    { name: '艮', lines: [0, 0, 1] },
    { name: '坤', lines: [0, 0, 0] },
  ];

  const radius = size * 0.35;
  const center = size / 2;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="animate-rotate-slow">
        <circle cx={center} cy={center} r={radius + 30} fill="none" stroke="var(--color-gold-dark)" strokeWidth="1" strokeOpacity="0.3" />
        <circle cx={center} cy={center} r={radius - 10} fill="none" stroke="var(--color-gold-dark)" strokeWidth="1" strokeOpacity="0.3" />

        {trigrams.map((trigram, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);

          return (
            <g key={trigram.name} transform={`translate(${x}, ${y})`}>
              {trigram.lines.map((line, j) => (
                <g key={j} transform={`translate(0, ${(j - 1) * 8})`}>
                  {line === 1 ? (
                    <rect x="-10" y="-2" width="20" height="4" fill="var(--color-gold)" rx="1" />
                  ) : (
                    <>
                      <rect x="-10" y="-2" width="8" height="4" fill="var(--color-gold)" rx="1" />
                      <rect x="2" y="-2" width="8" height="4" fill="var(--color-gold)" rx="1" />
                    </>
                  )}
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] opacity-20" />
      </div>
    </div>
  );
}
