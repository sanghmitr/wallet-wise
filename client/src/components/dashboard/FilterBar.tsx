import type { DashboardPreset, PaymentSource } from '@/types/domain';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  preset: DashboardPreset;
  source: PaymentSource | 'all';
  onPresetChange: (preset: DashboardPreset) => void;
  onSourceChange: (source: PaymentSource | 'all') => void;
}

const presets: Array<{ label: string; value: DashboardPreset }> = [
  { label: 'This Month', value: 'this-month' },
  { label: 'Last 30 Days', value: 'last-30-days' },
  { label: 'All Time', value: 'all-time' },
];

const sources: Array<{ label: string; value: PaymentSource | 'all' }> = [
  { label: 'All Sources', value: 'all' },
  { label: 'Credit', value: 'credit' },
  { label: 'Debit', value: 'debit' },
  { label: 'UPI', value: 'upi' },
  { label: 'Cash', value: 'cash' },
];

export function FilterBar({
  preset,
  source,
  onPresetChange,
  onSourceChange,
}: FilterBarProps) {
  return (
    <section className="no-scrollbar flex gap-3 overflow-x-auto py-2">
      {presets.map((item) => (
        <button
          key={item.value}
          onClick={() => onPresetChange(item.value)}
          className={cn(
            'whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition',
            preset === item.value
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
          )}
        >
          {item.label}
        </button>
      ))}

      <select
        value={source}
        onChange={(event) =>
          onSourceChange(event.target.value as PaymentSource | 'all')
        }
        className="rounded-full border-none bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/10"
      >
        {sources.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </section>
  );
}
