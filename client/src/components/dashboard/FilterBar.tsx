import type { DashboardPreset, PaymentMethod } from '@/types/domain';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  preset: DashboardPreset;
  paymentMethods: PaymentMethod[];
  paymentMethodId: string | 'all';
  onPresetChange: (preset: DashboardPreset) => void;
  onPaymentMethodChange: (paymentMethodId: string | 'all') => void;
}

const presets: Array<{ label: string; value: DashboardPreset }> = [
  { label: 'This Month', value: 'this-month' },
  { label: 'Last 30 Days', value: 'last-30-days' },
  { label: 'All Time', value: 'all-time' },
];

export function FilterBar({
  preset,
  paymentMethods,
  paymentMethodId,
  onPresetChange,
  onPaymentMethodChange,
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
        value={paymentMethodId}
        onChange={(event) => onPaymentMethodChange(event.target.value as string | 'all')}
        className="rounded-full border-none bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/10"
      >
        <option value="all">All Payment Methods</option>
        {paymentMethods.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </section>
  );
}
