'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, glass, className = '', children, ...props }, ref) => {
    const baseClass = glass ? 'glass ink-card' : 'card ink-card';
    const hoverClass = hover ? 'card-hover' : '';

    return (
      <div ref={ref} className={`${baseClass} ${hoverClass} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
