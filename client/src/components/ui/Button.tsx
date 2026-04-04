import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({
  className,
  children,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-primary text-on-primary shadow-ambient hover:bg-primary-dim',
        variant === 'secondary' &&
          'bg-primary-container text-on-primary-container hover:bg-surface-container-high',
        variant === 'ghost' &&
          'bg-transparent text-on-surface-variant hover:bg-surface-container-low',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
