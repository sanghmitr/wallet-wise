import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  heading: string;
  description: string;
  totalSpent: number;
  remainingBudget: number;
  topCategory: { name: string; value: number } | null;
  totalBudget: number;
  showBudgetMetrics: boolean;
}

export function SummaryCards({
  heading,
  description,
  totalSpent,
  remainingBudget,
  topCategory,
  totalBudget,
  showBudgetMetrics,
}: SummaryCardsProps) {
  const { settings } = useAppData();
  const usedShare =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <section
      className={cn(
        'grid grid-cols-1 gap-4',
        showBudgetMetrics ? 'md:grid-cols-3' : 'md:grid-cols-2',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,rgb(var(--color-primary))_0%,rgb(var(--color-primary-dim))_100%)] p-5 text-on-primary shadow-ambient sm:p-6 md:rounded-[2rem]',
          showBudgetMetrics ? 'md:col-span-2' : '',
        )}
      >
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            {heading}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl md:text-5xl">
            {formatCurrency(totalSpent, settings.currency)}
          </h2>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]">
            <MaterialIcon name="public" className="text-sm" />
            {settings.currency} / Selected currency
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/78">
            {description}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[rgba(255,248,242,0.16)] px-3 py-1 text-[11px] font-bold backdrop-blur-md">
            <MaterialIcon
              name={showBudgetMetrics ? 'timeline' : 'calendar_month'}
              className="text-sm"
            />
            {showBudgetMetrics ? 'Budget-aware snapshot' : 'Range-aware snapshot'}
          </div>
        </div>
        <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-[rgba(255,244,234,0.12)] blur-3xl" />
        <div className="absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-primary-container/35 blur-2xl" />
      </div>

      <div className="grid gap-4">
        {showBudgetMetrics ? (
          <Card className="bg-surface-container-lowest">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Remaining Budget
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-on-surface sm:text-2xl">
              {formatCurrency(remainingBudget, settings.currency)}
            </h3>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${usedShare}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-on-surface-variant">
              {formatCurrency(totalBudget, settings.currency)} total budget for the selected month.
            </p>
          </Card>
        ) : null}

        <Card className="flex items-center justify-between bg-surface-container-lowest">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Top Category
            </p>
            <h3 className="mt-1 text-lg font-bold text-on-surface sm:text-xl">
              {topCategory?.name ?? 'No expenses'}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
              {topCategory
                ? formatCompactCurrency(topCategory.value, settings.currency)
                : 'Start tracking'}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container sm:h-12 sm:w-12">
            <MaterialIcon name="theater_comedy" className="text-[18px] sm:text-[20px]" />
          </div>
        </Card>
      </div>
    </section>
  );
}
