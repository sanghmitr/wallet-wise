import { format, isThisMonth, isToday, parseISO } from 'date-fns';

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatExpenseDate(value: string) {
  const date = parseISO(value);

  if (isToday(date)) {
    return 'Today';
  }

  return format(date, 'MMM d, yyyy');
}

export function formatExpenseMeta(value: string) {
  const date = parseISO(value);

  if (isThisMonth(date)) {
    return format(date, 'EEEE');
  }

  return format(date, 'MMM d');
}

export function formatMonthLabel(value: string) {
  return format(parseISO(`${value}-01`), 'MMMM yyyy');
}

export function formatChatTime(value: string) {
  return format(parseISO(value), 'hh:mm a');
}
