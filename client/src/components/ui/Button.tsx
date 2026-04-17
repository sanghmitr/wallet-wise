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
        'inline-flex items-center justify-center rounded-full border px-6 py-3.5 font-display text-[0.95rem] font-medium tracking-[-0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'border-on-surface bg-on-surface text-background hover:opacity-90',
        variant === 'secondary' &&
          'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low',
        variant === 'ghost' &&
          'border-outline-variant/80 bg-transparent text-on-surface hover:bg-surface-container-lowest',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
