import { forwardRef, type HTMLAttributes, type PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<
  HTMLDivElement,
  PropsWithChildren<HTMLAttributes<HTMLDivElement>>
>(function Card({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-[1.75rem] bg-surface-container-lowest p-6 shadow-ambient',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
