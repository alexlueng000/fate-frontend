'use client';

import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const control = <input ref={ref} id={inputId} className={`ui-input ${className}`} aria-invalid={error ? true : invalid}
      aria-describedby={[describedBy, error ? errorId : ''].filter(Boolean).join(' ') || undefined} {...props} />;
    if (!label && !error) return control;
    return <div className="w-full">{label && <label htmlFor={inputId} className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">{label}</label>}{control}
      {error && <p id={errorId} role="alert" className="ui-field-error">{error}</p>}</div>;
  }
);
Input.displayName = 'Input';
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => <textarea ref={ref} className={`ui-input ui-textarea ${className}`} {...props} />
);
Textarea.displayName = 'Textarea';
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...props }, ref) => <select ref={ref} className={`ui-input ${className}`} {...props} />
);
Select.displayName = 'Select';
/** Choice/file controls retain their native sizing and interaction. */
export const ChoiceInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => <input ref={ref} className={`ui-choice ${className}`} {...props} />
);
ChoiceInput.displayName = 'ChoiceInput';
