import { useDeferredValue, useMemo, useState } from 'react';
import type { Expense } from '@/types/domain';
import { formatCurrency, formatExpenseDate } from '@/lib/format';
import { paymentMethodIcons } from '@/lib/payment-methods';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Card } from '@/components/ui/Card';
import { useAppData } from '@/store/AppDataContext';
import { sumExpenses } from '@/utils/analytics';

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return `rgba(95, 94, 94, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

interface RecentTransactionsProps {
  expenses: Expense[];
  title?: string;
  description?: string;
  summaryLabel?: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

interface TransactionGroup {
  date: string;
  total: number;
  count: number;
  expenses: Expense[];
}

function matchesSearch(expense: Expense, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    expense.category,
    expense.note ?? '',
    expense.merchant ?? '',
    expense.paymentMethodName,
    expense.amount.toString(),
    expense.amount.toFixed(2),
  ]
    .join(' ')
    .toLocaleLowerCase();

  if (searchableText.includes(normalizedQuery)) {
    return true;
  }

  const numericQuery = normalizedQuery.replace(/[^\d.]/g, '');

  if (!numericQuery) {
    return false;
  }

  return [expense.amount.toString(), expense.amount.toFixed(2)].some((value) =>
    value.includes(numericQuery),
  );
}

export function RecentTransactions({
  expenses,
  title = 'Transactions',
  description = 'All expenses matching the selected filters.',
  summaryLabel,
  onEdit,
  onDelete,
}: RecentTransactionsProps) {
  const { settings, categories } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const visibleExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          Boolean(expense?.id) && matchesSearch(expense, deferredSearchQuery),
      ),
    [deferredSearchQuery, expenses],
  );
  const displayedSummaryValue =
    summaryLabel && visibleExpenses.length
      ? formatCurrency(sumExpenses(visibleExpenses), settings.currency)
      : summaryLabel
        ? formatCurrency(0, settings.currency)
        : null;
  const groupedExpenses = useMemo(() => {
    const groups = new Map<string, Expense[]>();

    visibleExpenses.forEach((expense) => {
      const current = groups.get(expense.date) ?? [];
      current.push(expense);
      groups.set(expense.date, current);
    });

    return Array.from(groups.entries()).map(([date, dateExpenses]) => ({
      date,
      total: sumExpenses(dateExpenses),
      count: dateExpenses.length,
      expenses: dateExpenses,
    })) satisfies TransactionGroup[];
  }, [visibleExpenses]);

  return (
    <Card className="bg-surface-container-low">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-on-surface sm:text-lg">{title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {description}
          </p>
        </div>

        {summaryLabel && displayedSummaryValue ? (
          <div className="rounded-[1rem] bg-surface-container-low px-3.5 py-2.5 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              {summaryLabel}
            </p>
            <p className="mt-1 text-[1.05rem] font-black text-on-surface">
              {displayedSummaryValue}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
        <MaterialIcon
          name="search"
          className="shrink-0 text-[18px] text-on-surface-variant"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full border-none bg-transparent text-sm font-medium text-on-surface outline-none placeholder:text-on-surface-variant/70"
          placeholder="Search by category, note, merchant, or amount"
          aria-label="Search transactions"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="shrink-0 rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Clear transaction search"
          >
            <MaterialIcon name="close" className="text-[16px]" />
          </button>
        ) : null}
      </div>

      {!visibleExpenses.length ? (
        <div className="mt-5 rounded-[1.25rem] bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
          {searchQuery.trim()
            ? 'No expenses match this search inside the current filters.'
            : 'No expenses found for the selected filters.'}
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {groupedExpenses.map((group) => (
            <section key={group.date}>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-primary">
                    {formatExpenseDate(group.date)}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">
                    {group.count} transaction{group.count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-full border border-primary/10 bg-primary-container/55 px-3 py-1.5 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    Day Total
                  </p>
                  <p className="mt-1 text-sm font-bold text-on-surface">
                    {formatCurrency(group.total, settings.currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {group.expenses.map((expense) => {
                  const category = categories.find((item) => item.name === expense.category);
                  const accentColor = category?.color ?? '#a79892';
                  const accentBorder = hexToRgba(accentColor, 0.58);
                  const accentGlow = hexToRgba(accentColor, 0.2);
                  const accentSurface = hexToRgba(accentColor, 0.12);
                  const accentSurfaceSoft = hexToRgba(accentColor, 0.06);

                  return (
                    <div
                      key={expense.id}
                      className="rounded-[1.2rem] border bg-surface-container-lowest p-2.5 sm:p-3"
                      style={{
                        borderColor: accentBorder,
                        boxShadow: `inset 0 0 0 1px ${hexToRgba(accentColor, 0.16)}, 0 14px 30px ${accentGlow}`,
                        backgroundImage: `linear-gradient(135deg, ${accentSurface} 0%, ${accentSurfaceSoft} 24%, rgba(255,255,255,0) 62%), radial-gradient(circle at top right, ${accentSurfaceSoft} 0%, rgba(255,255,255,0) 38%)`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-[0.9rem] sm:h-9 sm:w-9 sm:rounded-[0.95rem]"
                            style={{
                              backgroundColor: accentSurface,
                              color: accentColor,
                              boxShadow: `inset 0 0 0 1px ${hexToRgba(accentColor, 0.18)}`,
                            }}
                          >
                            <MaterialIcon
                              name={paymentMethodIcons[expense.source] || 'payments'}
                              className="text-[16px] sm:text-[17px]"
                            />
                          </div>
                          <div className="flex min-h-[42px] flex-col justify-center">
                            <p className="text-sm font-bold text-on-surface sm:text-base">
                              {expense.note || expense.merchant || expense.category}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {expense.category} • {expense.paymentMethodName}
                            </p>
                          </div>
                        </div>

                        <div className="flex min-h-[42px] flex-col justify-center text-right">
                          <p className="text-sm font-bold text-on-surface sm:text-base">
                            {formatCurrency(expense.amount, settings.currency)}
                          </p>
                          <div className="mt-1.5 flex justify-end gap-0.5">
                            <button
                              onClick={() => onEdit(expense)}
                              className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-low"
                              aria-label="Edit expense"
                            >
                              <MaterialIcon name="edit" className="text-[17px]" />
                            </button>
                            <button
                              onClick={() => onDelete(expense.id)}
                              className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container-low hover:text-error"
                              aria-label="Delete expense"
                            >
                              <MaterialIcon name="delete" className="text-[17px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}
