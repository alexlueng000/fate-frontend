'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, glass, className = '', children, ...props }, ref) => {
    const baseClass = glass ? 'glass' : 'card';
    const hoverClass = hover ? 'card-hover' : '';

    return (
      <div ref={ref} className={`${baseClass} ${hoverClass} p-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
