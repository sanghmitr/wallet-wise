import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { PaymentMethodSpendChart } from '@/components/charts/PaymentMethodSpendChart';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { formatMonthLabel } from '@/lib/format';
import { useAppData } from '@/store/AppDataContext';
import type { DashboardPreset, DashboardRangeMode } from '@/types/domain';
import { getBudgets } from '@/services/budgets';
import { getApiErrorMessage } from '@/services/api';
import {
  filterExpensesByDateRange,
  filterExpensesByMonth,
  filterExpensesByPreset,
  filterExpensesByPaymentMethod,
  getBudgetRemaining,
  getCategoryTotals,
  getMonthlySeries,
  getPaymentMethodTotals,
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
  const [dashboardBudgets, setDashboardBudgets] = useState(budgets);
  const currentMonthKey = format(new Date(), 'yyyy-MM');

  const budgetMonth =
    rangeMode === 'month'
      ? selectedMonth
      : rangeMode === 'preset' && preset === 'this-month'
        ? currentMonthKey
        : null;

  const overviewExpenses = useMemo(() => {
    if (rangeMode === 'month') {
      return filterExpensesByMonth(expenses, selectedMonth);
    }

    if (rangeMode === 'custom') {
      return filterExpensesByDateRange(expenses, startDate || undefined, endDate || undefined);
    }

    return filterExpensesByPreset(expenses, preset);
  }, [endDate, expenses, preset, rangeMode, selectedMonth, startDate]);

  const transactionExpenses = useMemo(
    () => filterExpensesByPaymentMethod(overviewExpenses, paymentMethodId),
    [overviewExpenses, paymentMethodId],
  );
  const totalSpent = sumExpenses(overviewExpenses);
  const categoryTotals = getCategoryTotals(overviewExpenses);
  const paymentMethodTotals = getPaymentMethodTotals(overviewExpenses);
  const transactions = getSortedExpenses(transactionExpenses);
  const topCategory = getTopCategory(overviewExpenses);
  const totalBudget = dashboardBudgets.reduce((total, budget) => total + budget.limit, 0);
  const remainingBudget = getBudgetRemaining(dashboardBudgets, overviewExpenses);
  const showBudgetMetrics = budgetMonth !== null;

  useEffect(() => {
    let isCancelled = false;

    if (!budgetMonth) {
      setDashboardBudgets([]);
      return;
    }

    if (budgetMonth === currentMonthKey) {
      setDashboardBudgets(
        budgets.filter((budget) => budget.month === budgetMonth),
      );
      return;
    }

    void getBudgets(budgetMonth)
      .then((budgetData) => {
        if (!isCancelled) {
          setDashboardBudgets(budgetData);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setDashboardBudgets([]);
          toast.error(getApiErrorMessage(error));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [budgetMonth, budgets, currentMonthKey]);

  function handleRangeModeChange(mode: DashboardRangeMode) {
    setRangeMode(mode);

    if (mode === 'month' && !selectedMonth) {
      setSelectedMonth(format(new Date(), 'yyyy-MM'));
    }
  }

  function getSummaryHeading() {
    if (rangeMode === 'month') {
      return `Total Spent in ${formatMonthLabel(selectedMonth)}`;
    }

    if (rangeMode === 'custom') {
      if (startDate && endDate) {
        return `Total Spent from ${startDate} to ${endDate}`;
      }

      if (startDate) {
        return `Total Spent from ${startDate}`;
      }

      if (endDate) {
        return `Total Spent up to ${endDate}`;
      }

      return 'Total Spent in Custom Range';
    }

    if (preset === 'last-30-days') {
      return 'Total Spent Last 30 Days';
    }

    if (preset === 'all-time') {
      return 'Total Spent All Time';
    }

    return 'Total Spent This Month';
  }

  function getSummaryDescription() {
    if (rangeMode === 'month') {
      return `Overview for ${formatMonthLabel(selectedMonth)}.`;
    }

    if (rangeMode === 'custom') {
      if (startDate && endDate) {
        return `Overview from ${startDate} to ${endDate}.`;
      }

      if (startDate) {
        return `Overview from ${startDate} onward.`;
      }

      if (endDate) {
        return `Overview up to ${endDate}.`;
      }

      return 'Overview for the selected date range.';
    }

    if (preset === 'last-30-days') {
      return 'Overview for the last 30 days.';
    }

    if (preset === 'all-time') {
      return 'Overview across all recorded expenses.';
    }

    return 'Overview for the current month.';
  }

  function getTransactionDescription() {
    const paymentMethod = paymentMethods.find(
      (method) => method.id === paymentMethodId,
    );
    const paymentMethodText =
      paymentMethodId === 'all' || !paymentMethod
        ? ''
        : ` using ${paymentMethod.name}`;

    if (rangeMode === 'month') {
      return `Showing ${transactions.length} expenses for ${formatMonthLabel(
        selectedMonth,
      )}${paymentMethodText}.`;
    }

    if (rangeMode === 'custom') {
      if (startDate && endDate) {
        return `Showing ${transactions.length} expenses${paymentMethodText} from ${startDate} to ${endDate}.`;
      }

      if (startDate) {
        return `Showing ${transactions.length} expenses${paymentMethodText} from ${startDate} onward.`;
      }

      if (endDate) {
        return `Showing ${transactions.length} expenses${paymentMethodText} up to ${endDate}.`;
      }
    }

    if (preset === 'last-30-days') {
      return `Showing ${transactions.length} expenses${paymentMethodText} from the last 30 days.`;
    }

    if (preset === 'all-time') {
      return `Showing ${transactions.length} expenses${paymentMethodText} across all recorded time.`;
    }

    return `Showing ${transactions.length} expenses${paymentMethodText} for this month.`;
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
      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant sm:text-sm">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Start with a date range for the overall view. Payment-method filtering is kept with the transaction list below for a simpler flow.
          </p>
        </div>

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
          showPaymentMethodFilter={false}
        />
      </section>

      <SummaryCards
        heading={getSummaryHeading()}
        description={getSummaryDescription()}
        totalSpent={totalSpent}
        remainingBudget={remainingBudget}
        topCategory={topCategory}
        totalBudget={totalBudget}
        showBudgetMetrics={showBudgetMetrics}
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <CategoryPieChart data={categoryTotals} />
        <PaymentMethodSpendChart data={paymentMethodTotals} />
        <MonthlyTrendChart data={getMonthlySeries(overviewExpenses)} />
      </section>

      <section className="rounded-[1.5rem] bg-surface-container-low p-4 shadow-ambient sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Transactions Filter
            </p>
            <h2 className="mt-1 text-lg font-bold text-on-surface sm:text-xl">
              Filter by Payment Method
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              This filter refines only the expense list below while keeping the overview based on the selected date range.
            </p>
          </div>

          <label className="flex min-w-0 flex-col gap-2 md:min-w-[280px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Payment Method
            </span>
            <select
              value={paymentMethodId}
              onChange={(event) =>
                setPaymentMethodId(event.target.value as string | 'all')
              }
              className="rounded-[1rem] border-none bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
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
