import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import {
  formatCurrency,
  formatExpenseDate,
  formatMonthLabel,
} from '@/lib/format';
import { getPaymentMethodMeta } from '@/lib/payment-methods';
import { useAppData } from '@/store/AppDataContext';
import type { DashboardPreset, DashboardRangeMode } from '@/types/domain';
import {
  filterExpensesByCategory,
  filterExpensesByDateRange,
  filterExpensesByMonth,
  filterExpensesByPaymentMethod,
  filterExpensesByPreset,
  getSortedExpenses,
  sumExpenses,
} from '@/utils/analytics';

export function PaymentMethodPage() {
  const navigate = useNavigate();
  const { paymentMethodId = '' } = useParams();
  const {
    expenses,
    categories,
    paymentMethods,
    settings,
    openCreateExpense,
    openEditExpense,
    deleteExpense,
  } = useAppData();

  const paymentMethod = paymentMethods.find((item) => item.id === paymentMethodId);
  const [rangeMode, setRangeMode] = useState<DashboardRangeMode>('preset');
  const [preset, setPreset] = useState<DashboardPreset>('this-month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  const paymentMethodExpenses = useMemo(
    () => filterExpensesByPaymentMethod(expenses, paymentMethodId),
    [expenses, paymentMethodId],
  );

  const dateFilteredExpenses = useMemo(() => {
    if (rangeMode === 'month') {
      return filterExpensesByMonth(paymentMethodExpenses, selectedMonth);
    }

    if (rangeMode === 'custom') {
      return filterExpensesByDateRange(
        paymentMethodExpenses,
        startDate || undefined,
        endDate || undefined,
      );
    }

    return filterExpensesByPreset(paymentMethodExpenses, preset);
  }, [
    endDate,
    paymentMethodExpenses,
    preset,
    rangeMode,
    selectedMonth,
    startDate,
  ]);

  const visibleCategories = useMemo(() => {
    const categoryNames = new Set(paymentMethodExpenses.map((expense) => expense.category));

    return categories.filter((category) => categoryNames.has(category.name));
  }, [categories, paymentMethodExpenses]);

  const filteredExpenses = useMemo(
    () => filterExpensesByCategory(dateFilteredExpenses, selectedCategory),
    [dateFilteredExpenses, selectedCategory],
  );

  const transactions = useMemo(
    () => getSortedExpenses(filteredExpenses),
    [filteredExpenses],
  );
  const latestExpense = useMemo(
    () => getSortedExpenses(paymentMethodExpenses)[0] ?? null,
    [paymentMethodExpenses],
  );

  if (!paymentMethod) {
    return (
      <EmptyState
        title="Payment method not found"
        description="This payment method may have been deleted or is not available for the current account."
        actionLabel="Back to Profile"
        onAction={() => navigate('/profile')}
      />
    );
  }

  const activePaymentMethod = paymentMethod;
  const meta = getPaymentMethodMeta(activePaymentMethod.type);
  const totalSpent = sumExpenses(filteredExpenses);

  function handleRangeModeChange(mode: DashboardRangeMode) {
    setRangeMode(mode);

    if (mode === 'month' && !selectedMonth) {
      setSelectedMonth(format(new Date(), 'yyyy-MM'));
    }
  }

  function getTransactionDescription() {
    const categoryText =
      selectedCategory === 'all' ? '' : ` in ${selectedCategory}`;

    if (rangeMode === 'month') {
      return `Showing ${transactions.length} transactions for ${activePaymentMethod.name}${categoryText} in ${formatMonthLabel(
        selectedMonth,
      )}.`;
    }

    if (rangeMode === 'custom') {
      if (startDate && endDate) {
        return `Showing ${transactions.length} transactions for ${activePaymentMethod.name}${categoryText} from ${startDate} to ${endDate}.`;
      }

      if (startDate) {
        return `Showing ${transactions.length} transactions for ${activePaymentMethod.name}${categoryText} from ${startDate} onward.`;
      }

      if (endDate) {
        return `Showing ${transactions.length} transactions for ${activePaymentMethod.name}${categoryText} up to ${endDate}.`;
      }
    }

    if (preset === 'last-30-days') {
      return `Showing ${transactions.length} transactions for ${activePaymentMethod.name}${categoryText} from the last 30 days.`;
    }

    if (preset === 'all-time') {
      return `Showing ${transactions.length} transactions for ${activePaymentMethod.name}${categoryText} across all recorded time.`;
    }

    return `Showing ${transactions.length} transactions for ${activePaymentMethod.name}${categoryText} this month.`;
  }

  return (
    <div className="space-y-8 animate-float-in">
      <header className="space-y-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
        >
          <MaterialIcon name="arrow_back" className="text-[18px]" />
          Back to Profile
        </Link>

        <Card className="overflow-hidden bg-surface-container-low">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-surface-container-high text-primary">
                <MaterialIcon name={meta.icon} className="text-[30px]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Payment Method
                </p>
                <h1 className="mt-2 text-[1.7rem] font-extrabold tracking-tight text-on-surface sm:text-3xl">
                  {activePaymentMethod.name}
                </h1>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {meta.label} history with month and custom date filters for
                  reviewing billing cycles, statement periods, and recent usage.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[380px]">
              <div className="rounded-[1.5rem] bg-surface-container-lowest p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Type
                </p>
                <p className="mt-2 text-base font-bold text-on-surface">
                  {meta.label}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-surface-container-lowest p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Filtered Spend
                </p>
                <p className="mt-2 text-base font-bold text-on-surface">
                  {formatCurrency(totalSpent, settings.currency)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-surface-container-lowest p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Last Used
                </p>
                <p className="mt-2 text-base font-bold text-on-surface">
                  {latestExpense ? formatExpenseDate(latestExpense.date) : 'No transactions'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </header>

      <FilterBar
        rangeMode={rangeMode}
        preset={preset}
        selectedMonth={selectedMonth}
        startDate={startDate}
        endDate={endDate}
        paymentMethods={[]}
        categories={visibleCategories}
        paymentMethodId={activePaymentMethod.id}
        selectedCategory={selectedCategory}
        onRangeModeChange={handleRangeModeChange}
        onPresetChange={setPreset}
        onSelectedMonthChange={setSelectedMonth}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPaymentMethodChange={() => undefined}
        onCategoryChange={setSelectedCategory}
        showPaymentMethodFilter={false}
        paymentMethodLabel={activePaymentMethod.name}
        showCategoryFilter={visibleCategories.length > 0}
      />

      {!paymentMethodExpenses.length ? (
        <EmptyState
          title="No transactions for this payment method yet"
          description="Create an expense with this card or payment mode to start seeing its dedicated history here."
          actionLabel="Add expense"
          onAction={openCreateExpense}
        />
      ) : (
        <RecentTransactions
          expenses={transactions}
          title={`${activePaymentMethod.name} Transactions`}
          description={getTransactionDescription()}
          onEdit={openEditExpense}
          onDelete={(expenseId) =>
            void deleteExpense(expenseId).catch(() =>
              toast.error('Unable to delete transaction.'),
            )
          }
        />
      )}
    </div>
  );
}
