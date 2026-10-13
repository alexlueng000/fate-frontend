'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' | 'plain';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
const sizes = { sm: 'ui-button-sm', md: 'ui-button-md', lg: 'ui-button-lg', icon: 'ui-button-square' };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size, loading, disabled, className = '', children, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={`ui-button ui-button-${variant} ${size ? sizes[size] : ''} ${className}`} {...props}>
      {loading && <svg aria-hidden className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
