import {
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import type {
  Budget,
  Category,
  DashboardPreset,
  Expense,
  PaymentSource,
} from '@/types/domain';

export function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function filterExpensesByPreset(
  expenses: Expense[],
  preset: DashboardPreset,
) {
  const today = new Date();

  if (preset === 'all-time') {
    return expenses;
  }

  const range =
    preset === 'this-month'
      ? {
          start: startOfMonth(today),
          end: endOfMonth(today),
        }
      : {
          start: subDays(today, 29),
          end: today,
        };

  return expenses.filter((expense) =>
    isWithinInterval(parseISO(expense.date), range),
  );
}

export function filterExpensesBySource(
  expenses: Expense[],
  source: PaymentSource | 'all',
) {
  if (source === 'all') {
    return expenses;
  }

  return expenses.filter((expense) => expense.source === source);
}

export function getCategoryTotals(expenses: Expense[]) {
  return Object.entries(
    expenses.reduce<Record<string, number>>((accumulator, expense) => {
      accumulator[expense.category] =
        (accumulator[expense.category] || 0) + expense.amount;

      return accumulator;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
}

export function getTopCategory(expenses: Expense[]) {
  return getCategoryTotals(expenses)[0] ?? null;
}

export function getMonthlySeries(expenses: Expense[]) {
  return Array.from({ length: 6 }).map((_, index) => {
    const date = subMonths(new Date(), 5 - index);
    const monthKey = format(date, 'yyyy-MM');

    const value = sumExpenses(
      expenses.filter((expense) => expense.date.startsWith(monthKey)),
    );

    return {
      month: format(date, 'MMM'),
      value,
    };
  });
}

export function getBudgetUsage(
  budgets: Budget[],
  expenses: Expense[],
  categories: Category[],
) {
  return categories.map((category) => {
    const budget = budgets.find((item) => item.category === category.name);
    const spent = sumExpenses(
      expenses.filter((expense) => expense.category === category.name),
    );
    const limit = budget?.limit ?? 0;
    const usage = limit > 0 ? spent / limit : 0;

    return {
      category: category.name,
      icon: category.icon,
      color: category.color,
      spent,
      limit,
      usage,
      isWarning: usage >= 0.8,
    };
  });
}

export function getRecentTransactions(expenses: Expense[], count = 5) {
  return [...expenses]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, count);
}

export function getBudgetRemaining(budgets: Budget[], expenses: Expense[]) {
  const totalBudget = budgets.reduce((total, budget) => total + budget.limit, 0);
  return totalBudget - sumExpenses(expenses);
}
