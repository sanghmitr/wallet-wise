import { cn } from '@/lib/utils';

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function MaterialIcon({
  name,
  className,
  filled = false,
}: MaterialIconProps) {
  return (
    <span
      className={cn('material-symbols-outlined', className)}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' 24` }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
