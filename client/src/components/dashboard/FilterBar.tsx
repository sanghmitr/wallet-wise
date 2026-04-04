import { format } from 'date-fns';
import type {
  DashboardPreset,
  DashboardRangeMode,
  PaymentMethod,
} from '@/types/domain';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  rangeMode: DashboardRangeMode;
  preset: DashboardPreset;
  selectedMonth: string;
  startDate: string;
  endDate: string;
  paymentMethods: PaymentMethod[];
  paymentMethodId: string | 'all';
  onRangeModeChange: (mode: DashboardRangeMode) => void;
  onPresetChange: (preset: DashboardPreset) => void;
  onSelectedMonthChange: (month: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onPaymentMethodChange: (paymentMethodId: string | 'all') => void;
  showPaymentMethodFilter?: boolean;
  paymentMethodLabel?: string;
}

const presets: Array<{ label: string; value: DashboardPreset }> = [
  { label: 'This Month', value: 'this-month' },
  { label: 'Last 30 Days', value: 'last-30-days' },
  { label: 'All Time', value: 'all-time' },
];

const rangeModes: Array<{ label: string; value: DashboardRangeMode }> = [
  { label: 'Preset', value: 'preset' },
  { label: 'Month', value: 'month' },
  { label: 'Custom Range', value: 'custom' },
];

export function FilterBar({
  rangeMode,
  preset,
  selectedMonth,
  startDate,
  endDate,
  paymentMethods,
  paymentMethodId,
  onRangeModeChange,
  onPresetChange,
  onSelectedMonthChange,
  onStartDateChange,
  onEndDateChange,
  onPaymentMethodChange,
  showPaymentMethodFilter = true,
  paymentMethodLabel,
}: FilterBarProps) {
  return (
    <section className="space-y-4">
      <div className="no-scrollbar flex gap-3 overflow-x-auto py-2">
        {rangeModes.map((item) => (
          <button
            key={item.value}
            onClick={() => onRangeModeChange(item.value)}
            className={cn(
              'whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition',
              rangeMode === item.value
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        {rangeMode === 'preset' ? (
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
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
          </div>
        ) : null}

        {rangeMode === 'month' ? (
          <label className="flex min-w-[210px] flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Select Month
            </span>
            <input
              type="month"
              value={selectedMonth}
              max={format(new Date(), 'yyyy-MM')}
              onChange={(event) => onSelectedMonthChange(event.target.value)}
              className="rounded-[1.25rem] border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/10"
            />
          </label>
        ) : null}

        {rangeMode === 'custom' ? (
          <>
            <label className="flex min-w-[210px] flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Start Date
              </span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="rounded-[1.25rem] border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="flex min-w-[210px] flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                End Date
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="rounded-[1.25rem] border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/10"
              />
            </label>
          </>
        ) : null}

        {showPaymentMethodFilter ? (
          <label className="flex min-w-[260px] flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Payment Method
            </span>
            <select
              value={paymentMethodId}
              onChange={(event) =>
                onPaymentMethodChange(event.target.value as string | 'all')
              }
              className="rounded-[1.25rem] border-none bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : paymentMethodLabel ? (
          <div className="flex min-w-[260px] flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Payment Method
            </span>
            <div className="rounded-[1.25rem] bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
              {paymentMethodLabel}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
