import { useMemo } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { formatCurrency, formatMonthLabel } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';
import { getBudgetUsage, getCategoryTotals, sumExpenses } from '@/utils/analytics';

export function BudgetManager() {
  const {
    budgets,
    categories,
    expenses,
    saveBudget,
    settings,
    canPerformServerActions,
  } = useAppData();
  const currentMonth = format(new Date(), 'yyyy-MM');

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(currentMonth)),
    [currentMonth, expenses],
  );
  const usage = useMemo(
    () => getBudgetUsage(budgets, monthExpenses, categories),
    [budgets, categories, monthExpenses],
  );
  const categoryBreakdown = useMemo(
    () => getCategoryTotals(monthExpenses),
    [monthExpenses],
  );

  const totalBudget = budgets.reduce((total, budget) => total + budget.limit, 0);
  const totalSpent = sumExpenses(monthExpenses);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          Budgets
        </p>
        <h1 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-on-surface sm:text-3xl">
          Monthly Limits
        </h1>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Curation of your financial boundaries for {formatMonthLabel(currentMonth)}
        </p>

        {!canPerformServerActions ? (
          <div className="mt-4 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
            Budget edits are paused until the backend is online.
          </div>
        ) : null}
      </section>

      <Card className="relative overflow-hidden bg-[linear-gradient(135deg,rgb(var(--color-primary))_0%,rgb(var(--color-primary-dim))_100%)] text-on-primary">
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">
            Total Monthly Budget
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {formatCurrency(totalBudget, settings.currency)}
          </h2>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/75">Current spend</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(totalSpent, settings.currency)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </Card>

      {categoryBreakdown.length ? (
        <CategoryPieChart data={categoryBreakdown} />
      ) : (
        <Card className="border border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-on-surface">
                Category Breakdown
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Add a few expenses in {formatMonthLabel(currentMonth)} to see how your spending is distributed across categories.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary">
              <MaterialIcon name="pie_chart" className="text-[24px]" />
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        {usage.map((item) => (
          <Card
            key={item.category}
            className="border border-outline-variant/20 bg-surface-container-lowest"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                  <MaterialIcon name={item.icon} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">{item.category}</h3>
                  <p className="text-xs font-medium text-on-surface-variant">
                    Monthly budget limit
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="sr-only">Budget amount</span>
                <input
                  type="number"
                  defaultValue={item.limit || ''}
                  disabled={!canPerformServerActions}
                  onBlur={(event) =>
                    void saveBudget({
                      category: item.category,
                      limit: Number(event.target.value || 0),
                      month: currentMonth,
                    })
                  }
                  className="w-24 rounded-xl border-none bg-surface-container-low px-3 py-2 text-right text-sm font-bold text-primary outline-none"
                  placeholder="0"
                />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-end justify-between gap-4">
                <span className="text-xs font-bold text-on-surface">
                  {formatCurrency(item.spent, settings.currency)} spent
                </span>
                <span className="text-xs font-medium text-on-surface-variant">
                  {item.limit > 0 ? `${Math.round(item.usage * 100)}% utilized` : 'No limit'}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className={`h-full rounded-full ${
                    item.isWarning ? 'bg-error' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(item.usage * 100, 100)}%` }}
                />
              </div>

              <div
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] ${
                  item.isWarning ? 'text-error' : 'text-tertiary'
                }`}
              >
                <MaterialIcon
                  name={item.isWarning ? 'warning' : 'check_circle'}
                  filled
                  className="text-sm"
                />
                {item.isWarning ? 'Approaching monthly limit' : 'Well within target'}
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
