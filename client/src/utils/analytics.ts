import {
  endOfMonth,
  format,
  isAfter,
  isBefore,
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

export function filterExpensesByMonth(expenses: Expense[], month: string) {
  if (!month) {
    return expenses;
  }

  return expenses.filter((expense) => expense.date.startsWith(month));
}

export function filterExpensesByDateRange(
  expenses: Expense[],
  startDate?: string,
  endDate?: string,
) {
  if (!startDate && !endDate) {
    return expenses;
  }

  return expenses.filter((expense) => {
    const date = parseISO(expense.date);

    if (startDate && isBefore(date, parseISO(startDate))) {
      return false;
    }

    if (endDate && isAfter(date, parseISO(endDate))) {
      return false;
    }

    return true;
  });
}

export function filterExpensesByPaymentMethod(
  expenses: Expense[],
  paymentMethodId: string | 'all',
) {
  if (paymentMethodId === 'all') {
    return expenses;
  }

  return expenses.filter(
    (expense) => expense.paymentMethodId === paymentMethodId,
  );
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

export function getSortedExpenses(expenses: Expense[]) {
  return [...expenses].sort((left, right) => right.date.localeCompare(left.date));
}

export function getBudgetRemaining(budgets: Budget[], expenses: Expense[]) {
  const totalBudget = budgets.reduce((total, budget) => total + budget.limit, 0);
  return totalBudget - sumExpenses(expenses);
}
