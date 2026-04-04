import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] bg-surface-container-low p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary shadow-ambient">
        <MaterialIcon name="dataset" className="text-[26px]" />
      </div>
      <h3 className="text-lg font-bold text-on-surface">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
