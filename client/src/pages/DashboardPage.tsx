import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { formatMonthLabel } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';
import type { DashboardPreset, DashboardRangeMode } from '@/types/domain';
import {
  filterExpensesByDateRange,
  filterExpensesByMonth,
  filterExpensesByPreset,
  filterExpensesByPaymentMethod,
  getBudgetRemaining,
  getCategoryTotals,
  getMonthlySeries,
  getSortedExpenses,
  getTopCategory,
  sumExpenses,
} from '@/utils/analytics';

export function DashboardPage() {
  const {
    expenses,
    budgets,
    paymentMethods,
    openEditExpense,
    deleteExpense,
    openCreateExpense,
  } = useAppData();
  const [rangeMode, setRangeMode] = useState<DashboardRangeMode>('preset');
  const [preset, setPreset] = useState<DashboardPreset>('this-month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState<string | 'all'>('all');

  const rangeFilteredExpenses = useMemo(() => {
    if (rangeMode === 'month') {
      return filterExpensesByMonth(expenses, selectedMonth);
    }

    if (rangeMode === 'custom') {
      return filterExpensesByDateRange(expenses, startDate || undefined, endDate || undefined);
    }

    return filterExpensesByPreset(expenses, preset);
  }, [endDate, expenses, preset, rangeMode, selectedMonth, startDate]);

  const filteredExpenses = useMemo(
    () => filterExpensesByPaymentMethod(rangeFilteredExpenses, paymentMethodId),
    [paymentMethodId, rangeFilteredExpenses],
  );
  const currentMonthExpenses = filterExpensesByPreset(expenses, 'this-month');
  const totalSpent = sumExpenses(currentMonthExpenses);
  const categoryTotals = getCategoryTotals(filteredExpenses);
  const transactions = getSortedExpenses(filteredExpenses);

  function handleRangeModeChange(mode: DashboardRangeMode) {
    setRangeMode(mode);

    if (mode === 'month' && !selectedMonth) {
      setSelectedMonth(format(new Date(), 'yyyy-MM'));
    }
  }

  function getTransactionDescription() {
    if (rangeMode === 'month') {
      return `Showing ${transactions.length} expenses for ${formatMonthLabel(
        selectedMonth,
      )}.`;
    }

    if (rangeMode === 'custom') {
      if (startDate && endDate) {
        return `Showing ${transactions.length} expenses from ${startDate} to ${endDate}.`;
      }

      if (startDate) {
        return `Showing ${transactions.length} expenses from ${startDate} onward.`;
      }

      if (endDate) {
        return `Showing ${transactions.length} expenses up to ${endDate}.`;
      }
    }

    if (preset === 'last-30-days') {
      return `Showing ${transactions.length} expenses from the last 30 days.`;
    }

    if (preset === 'all-time') {
      return `Showing ${transactions.length} expenses across all recorded time.`;
    }

    return `Showing ${transactions.length} expenses for this month.`;
  }

  if (!expenses.length) {
    return (
      <EmptyState
        title="No expenses yet"
        description="Add your first expense to unlock the dashboard, charts, and AI summaries."
        actionLabel="Add expense"
        onAction={openCreateExpense}
      />
    );
  }

  return (
    <div className="space-y-8 animate-float-in">
      <FilterBar
        rangeMode={rangeMode}
        preset={preset}
        selectedMonth={selectedMonth}
        startDate={startDate}
        endDate={endDate}
        paymentMethods={paymentMethods}
        paymentMethodId={paymentMethodId}
        onRangeModeChange={handleRangeModeChange}
        onPresetChange={setPreset}
        onSelectedMonthChange={setSelectedMonth}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPaymentMethodChange={setPaymentMethodId}
      />

      <SummaryCards
        totalSpent={totalSpent}
        remainingBudget={getBudgetRemaining(budgets, currentMonthExpenses)}
        topCategory={getTopCategory(filteredExpenses)}
        totalBudget={budgets.reduce((total, budget) => total + budget.limit, 0)}
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CategoryPieChart data={categoryTotals} />
        <MonthlyTrendChart data={getMonthlySeries(filteredExpenses)} />
      </section>

      <RecentTransactions
        expenses={transactions}
        title="Filtered Transactions"
        description={getTransactionDescription()}
        onEdit={openEditExpense}
        onDelete={(expenseId) =>
          void deleteExpense(expenseId).catch(() =>
            toast.error('Unable to delete transaction.'),
          )
        }
      />
    </div>
  );
}
