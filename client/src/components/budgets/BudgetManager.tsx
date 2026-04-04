import { useMemo } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { formatCurrency, formatMonthLabel } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';
import { getBudgetUsage, sumExpenses } from '@/utils/analytics';

export function BudgetManager() {
  const { budgets, categories, expenses, saveBudget, settings } = useAppData();
  const currentMonth = format(new Date(), 'yyyy-MM');

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(currentMonth)),
    [currentMonth, expenses],
  );
  const usage = useMemo(
    () => getBudgetUsage(budgets, monthExpenses, categories),
    [budgets, categories, monthExpenses],
  );

  const totalBudget = budgets.reduce((total, budget) => total + budget.limit, 0);
  const totalSpent = sumExpenses(monthExpenses);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
          Monthly Limits
        </h1>
        <p className="mt-2 text-sm font-medium text-on-surface-variant">
          Curation of your financial boundaries for {formatMonthLabel(currentMonth)}
        </p>
      </section>

      <Card className="relative overflow-hidden bg-[linear-gradient(135deg,rgb(var(--color-primary))_0%,rgb(var(--color-primary-dim))_100%)] text-on-primary">
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.24em] text-white/75">
            Total Monthly Budget
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em]">
            {formatCurrency(totalBudget, settings.currency)}
          </h2>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/75">Current spend</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(totalSpent, settings.currency)}
              </p>
            </div>
            <Button variant="secondary">Adjust Total</Button>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </Card>

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
                  <h3 className="font-bold text-on-surface">{item.category}</h3>
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
