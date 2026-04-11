import type { Expense } from '@/types/domain';
import { formatCurrency, formatExpenseDate, formatExpenseMeta } from '@/lib/format';
import { paymentMethodIcons } from '@/lib/payment-methods';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Card } from '@/components/ui/Card';
import { useAppData } from '@/store/AppDataContext';

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
  summaryValue?: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export function RecentTransactions({
  expenses,
  title = 'Transactions',
  description = 'All expenses matching the selected filters.',
  summaryLabel,
  summaryValue,
  onEdit,
  onDelete,
}: RecentTransactionsProps) {
  const { settings, categories } = useAppData();
  const visibleExpenses = expenses.filter((expense) => Boolean(expense?.id));

  return (
    <Card className="bg-surface-container-low">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-on-surface sm:text-lg">{title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {description}
          </p>
        </div>

        {summaryLabel && summaryValue ? (
          <div className="rounded-[1rem] bg-surface-container-low px-3.5 py-2.5 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              {summaryLabel}
            </p>
            <p className="mt-1 text-[1.05rem] font-black text-on-surface">
              {summaryValue}
            </p>
          </div>
        ) : null}
      </div>

      {!visibleExpenses.length ? (
        <div className="mt-5 rounded-[1.25rem] bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
          No expenses found for the selected filters.
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
        {visibleExpenses.map((expense) => (
          (() => {
            const category = categories.find((item) => item.name === expense.category);
            const accentColor = category?.color ?? '#a79892';
            const accentBorder = hexToRgba(accentColor, 0.38);
            const accentGlow = hexToRgba(accentColor, 0.16);
            const accentSurface = hexToRgba(accentColor, 0.08);

            return (
              <div
                key={expense.id}
                className="rounded-[1.2rem] border bg-surface-container-lowest p-3 sm:p-3.5"
                style={{
                  borderColor: accentBorder,
                  boxShadow: `0 14px 30px ${accentGlow}`,
                  backgroundImage: `linear-gradient(135deg, ${accentSurface} 0%, rgba(255,255,255,0) 42%)`,
                }}
              >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] sm:h-10 sm:w-10 sm:rounded-[1rem]"
                  style={{
                    backgroundColor: accentSurface,
                    color: accentColor,
                    boxShadow: `inset 0 0 0 1px ${hexToRgba(accentColor, 0.18)}`,
                  }}
                >
                  <MaterialIcon
                    name={paymentMethodIcons[expense.source] || 'payments'}
                    className="text-[17px] sm:text-[18px]"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface sm:text-base">
                    {expense.note || expense.merchant || expense.category}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {expense.category} • {expense.paymentMethodName} •{' '}
                    {formatExpenseMeta(expense.date)}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formatExpenseDate(expense.date)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-on-surface sm:text-base">
                  {formatCurrency(expense.amount, settings.currency)}
                </p>
                <div className="mt-2 flex justify-end gap-0.5">
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
          })()
        ))}
        </div>
      )}
    </Card>
  );
}
