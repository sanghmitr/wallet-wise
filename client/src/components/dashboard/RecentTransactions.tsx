import type { Expense } from '@/types/domain';
import { formatCurrency, formatExpenseDate, formatExpenseMeta } from '@/lib/format';
import { paymentMethodIcons } from '@/lib/payment-methods';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Card } from '@/components/ui/Card';
import { useAppData } from '@/store/AppDataContext';

interface RecentTransactionsProps {
  expenses: Expense[];
  title?: string;
  description?: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export function RecentTransactions({
  expenses,
  title = 'Transactions',
  description = 'All expenses matching the selected filters.',
  onEdit,
  onDelete,
}: RecentTransactionsProps) {
  const { settings } = useAppData();

  return (
    <Card className="bg-surface-container-low">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-on-surface">{title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {description}
          </p>
        </div>
      </div>

      {!expenses.length ? (
        <div className="mt-6 rounded-[1.5rem] bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
          No expenses found for the selected filters.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-ambient"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
                  <MaterialIcon name={paymentMethodIcons[expense.source] || 'payments'} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">
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
                <p className="font-bold text-on-surface">
                  {formatCurrency(expense.amount, settings.currency)}
                </p>
                <div className="mt-3 flex justify-end gap-1">
                  <button
                    onClick={() => onEdit(expense)}
                    className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low"
                    aria-label="Edit expense"
                  >
                    <MaterialIcon name="edit" className="text-[18px]" />
                  </button>
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low hover:text-error"
                    aria-label="Delete expense"
                  >
                    <MaterialIcon name="delete" className="text-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </Card>
  );
}
