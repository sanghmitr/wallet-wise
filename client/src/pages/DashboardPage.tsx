import { useState } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { useAppData } from '@/store/AppDataContext';
import type { DashboardPreset, PaymentSource } from '@/types/domain';
import {
  filterExpensesByPreset,
  filterExpensesBySource,
  getBudgetRemaining,
  getCategoryTotals,
  getMonthlySeries,
  getRecentTransactions,
  getTopCategory,
  sumExpenses,
} from '@/utils/analytics';

export function DashboardPage() {
  const { expenses, budgets, openEditExpense, deleteExpense, openCreateExpense } =
    useAppData();
  const [preset, setPreset] = useState<DashboardPreset>('this-month');
  const [source, setSource] = useState<PaymentSource | 'all'>('all');

  const presetExpenses = filterExpensesByPreset(expenses, preset);
  const filteredExpenses = filterExpensesBySource(presetExpenses, source);
  const currentMonthExpenses = filterExpensesByPreset(expenses, 'this-month');
  const totalSpent = sumExpenses(currentMonthExpenses);
  const categoryTotals = getCategoryTotals(filteredExpenses);
  const recentTransactions = getRecentTransactions(filteredExpenses);

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
        preset={preset}
        source={source}
        onPresetChange={setPreset}
        onSourceChange={setSource}
      />

      <SummaryCards
        totalSpent={totalSpent}
        remainingBudget={getBudgetRemaining(budgets, currentMonthExpenses)}
        topCategory={getTopCategory(filteredExpenses)}
        totalBudget={budgets.reduce((total, budget) => total + budget.limit, 0)}
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CategoryPieChart data={categoryTotals} />
        <MonthlyTrendChart data={getMonthlySeries(expenses)} />
      </section>

      <RecentTransactions
        expenses={recentTransactions}
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
