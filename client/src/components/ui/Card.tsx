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
        'rounded-[1.5rem] border border-outline-variant/70 bg-surface-container-lowest/88 p-4 shadow-ambient backdrop-blur-xl sm:rounded-[1.6rem] sm:p-5 md:rounded-[1.75rem] md:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
