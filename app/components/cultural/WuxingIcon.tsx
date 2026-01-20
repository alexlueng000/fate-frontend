'use client';

import { wuxingMap, WuxingElement } from '@/app/lib/design-tokens';

interface WuxingIconProps {
  element: WuxingElement;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
};

const iconPaths: Record<string, string> = {
  木: 'M12 2v20M7 7l5-5 5 5M7 12h10',
  火: 'M12 2L8 10h8L12 2zM8 10l4 12 4-12',
  土: 'M4 14h16M6 10h12M8 6h8M10 18h4',
  金: 'M12 2l8 8-8 8-8-8 8-8z',
  水: 'M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-4-2-8-6-12z',
};

export default function WuxingIcon({ element, size = 'md', showLabel }: WuxingIconProps) {
  const config = wuxingMap[element];
  if (!config) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold font-serif`}
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`,
        }}
      >
        {element}
      </div>
      {showLabel && (
        <span className="text-xs" style={{ color: config.color }}>
          {element}
        </span>
      )}
    </div>
  );
}
