import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';

interface SummaryCardsProps {
  totalSpent: number;
  remainingBudget: number;
  topCategory: { name: string; value: number } | null;
  totalBudget: number;
}

export function SummaryCards({
  totalSpent,
  remainingBudget,
  topCategory,
  totalBudget,
}: SummaryCardsProps) {
  const { settings } = useAppData();
  const usedShare =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-on-primary shadow-ambient md:col-span-2">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            Total Spent This Month
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
            {formatCurrency(totalSpent, settings.currency)}
          </h2>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">
            <MaterialIcon name="public" className="text-sm" />
            {settings.currency} / Selected currency
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
            <MaterialIcon name="timeline" className="text-sm" />
            Tracking spending momentum
          </div>
        </div>
        <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-primary-dim/40 blur-2xl" />
      </div>

      <div className="grid gap-4">
        <Card className="bg-surface-container-lowest">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            Remaining Budget
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
            {formatCurrency(remainingBudget, settings.currency)}
          </h3>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${usedShare}%` }}
            />
          </div>
        </Card>

        <Card className="flex items-center justify-between bg-surface-container-lowest">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Top Category
            </p>
            <h3 className="mt-1 text-xl font-bold text-on-surface">
              {topCategory?.name ?? 'No expenses'}
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {topCategory
                ? formatCompactCurrency(topCategory.value, settings.currency)
                : 'Start tracking'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <MaterialIcon name="theater_comedy" />
          </div>
        </Card>
      </div>
    </section>
  );
}
