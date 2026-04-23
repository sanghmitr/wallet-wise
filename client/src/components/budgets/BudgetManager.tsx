import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { formatCurrency, formatMonthLabel } from '@/lib/format';
import { getBudgets } from '@/services/budgets';
import { useAppData } from '@/store/AppDataContext';
import type { Budget } from '@/types/domain';
import {
  filterBudgetTrackedExpenses,
  getBudgetTrackedCategories,
  getBudgetTrackedTotal,
  getBudgetUsage,
  getCategoryTotals,
  sumExpenses,
} from '@/utils/analytics';

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
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedMonthBudgets, setSelectedMonthBudgets] = useState<Budget[]>(budgets);
  const [isLoadingMonthBudgets, setIsLoadingMonthBudgets] = useState(false);

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(selectedMonth)),
    [selectedMonth, expenses],
  );
  const budgetTrackedCategories = useMemo(
    () => getBudgetTrackedCategories(categories),
    [categories],
  );
  const excludedCategories = useMemo(
    () => categories.filter((category) => !category.includeInMonthlyBudget),
    [categories],
  );
  const budgetTrackedExpenses = useMemo(
    () => filterBudgetTrackedExpenses(monthExpenses, categories),
    [categories, monthExpenses],
  );
  const usage = useMemo(
    () => getBudgetUsage(selectedMonthBudgets, budgetTrackedExpenses, categories),
    [selectedMonthBudgets, budgetTrackedExpenses, categories],
  );
  const categoryBreakdown = useMemo(
    () => getCategoryTotals(budgetTrackedExpenses),
    [budgetTrackedExpenses],
  );

  const totalBudget = getBudgetTrackedTotal(selectedMonthBudgets, categories);
  const totalSpent = sumExpenses(budgetTrackedExpenses);
  const isBudgetExceeded = totalBudget > 0 && totalSpent > totalBudget;
  const remainingBudget = totalBudget - totalSpent;

  useEffect(() => {
    let isActive = true;

    if (selectedMonth === currentMonth) {
      setSelectedMonthBudgets(budgets);
      setIsLoadingMonthBudgets(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoadingMonthBudgets(true);
    setSelectedMonthBudgets([]);

    void getBudgets(selectedMonth)
      .then((loadedBudgets) => {
        if (!isActive) {
          return;
        }

        setSelectedMonthBudgets(loadedBudgets);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setSelectedMonthBudgets([]);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsLoadingMonthBudgets(false);
      });

    return () => {
      isActive = false;
    };
  }, [budgets, currentMonth, selectedMonth]);

  return (
    <div className="space-y-8 pt-2 sm:pt-0">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          Budgets
        </p>
        <h1 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-on-surface sm:text-3xl">
          Monthly Limits
        </h1>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Curation of your financial boundaries for {formatMonthLabel(selectedMonth)}
        </p>
        <div className="mt-4">
          <label className="flex items-center justify-between gap-3 self-start rounded-[1.2rem] border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Month
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                if (event.target.value) {
                  setSelectedMonth(event.target.value);
                }
              }}
              className="rounded-lg border-none bg-transparent text-base font-semibold text-on-surface outline-none sm:text-sm"
            />
          </label>
        </div>
        {excludedCategories.length ? (
          <div className="mt-4 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
            {excludedCategories.map((category) => category.name).join(', ')}{' '}
            {excludedCategories.length === 1 ? 'is' : 'are'} excluded from monthly
            budget tracking.
          </div>
        ) : null}

        {isLoadingMonthBudgets ? (
          <div className="mt-4 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
            Loading saved budget limits for {formatMonthLabel(selectedMonth)}.
          </div>
        ) : null}

        {!canPerformServerActions ? (
          <div className="mt-4 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
            Budget edits are paused until the backend is online.
          </div>
        ) : null}
      </section>

      <Card
        className={`relative overflow-hidden text-on-primary ${
          isBudgetExceeded
            ? 'bg-[linear-gradient(135deg,#dc5c67_0%,#8d1f30_100%)]'
            : 'bg-[linear-gradient(135deg,#3b8f68_0%,#235843_100%)]'
        }`}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">
              Total Monthly Budget
            </p>
            <div
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                isBudgetExceeded
                  ? 'bg-white/16 text-white'
                  : 'bg-white/16 text-white'
              }`}
            >
              {isBudgetExceeded ? 'Exceeded' : 'On Track'}
            </div>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {formatCurrency(totalBudget, settings.currency)}
          </h2>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/75">Budget-tracked spend</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(totalSpent, settings.currency)}
              </p>
              <p className="mt-2 text-xs text-white/75">
                {isBudgetExceeded
                  ? `${formatCurrency(Math.abs(remainingBudget), settings.currency)} over your budget`
                  : `${formatCurrency(Math.max(remainingBudget, 0), settings.currency)} remaining`}
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
                Add a few budget-tracked expenses in {formatMonthLabel(selectedMonth)} to
                see how your spending is distributed across categories.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary">
              <MaterialIcon name="pie_chart" className="text-[24px]" />
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        {budgetTrackedCategories.length ? (
          usage.map((item) => (
            <Card
              key={`${selectedMonth}-${item.category}`}
              className="border border-outline-variant/20 bg-surface-container-lowest p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-surface-container-low text-primary">
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
                    key={`${selectedMonth}-${item.category}-${item.limit}`}
                    type="number"
                    defaultValue={item.limit || ''}
                    disabled={isLoadingMonthBudgets || !canPerformServerActions}
                    onBlur={async (event) => {
                      const saved = await saveBudget({
                        category: item.category,
                        limit: Number(event.target.value || 0),
                        month: selectedMonth,
                      });

                      if (!saved || saved.month !== selectedMonth) {
                        return;
                      }

                      setSelectedMonthBudgets((current) => {
                        const existingIndex = current.findIndex(
                          (budget) => budget.category === saved.category,
                        );

                        if (existingIndex === -1) {
                          return [...current, saved].sort((left, right) =>
                            left.category.localeCompare(right.category),
                          );
                        }

                        return current.map((budget, index) =>
                          index === existingIndex ? saved : budget,
                        );
                      });
                    }}
                    className="w-24 rounded-xl border-none bg-surface-container-low px-3 py-1.5 text-right text-base font-bold text-primary outline-none sm:text-sm"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-end justify-between gap-3">
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
          ))
        ) : (
          <Card className="border border-dashed border-outline-variant/30 bg-surface-container-lowest p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-surface-container-low text-primary">
                <MaterialIcon name="wallet" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  No budget-tracked categories
                </h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Re-enable monthly budget tracking on at least one category to manage
                  limits here.
                </p>
              </div>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
