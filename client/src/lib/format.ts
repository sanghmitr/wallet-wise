import { format, isThisMonth, isToday, parseISO } from 'date-fns';
import type { CurrencyCode } from '@/types/domain';

export const currencyOptions: Array<{
  value: CurrencyCode;
  label: string;
}> = [
  { value: 'INR', label: 'Indian Rupee' },
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'AED', label: 'UAE Dirham' },
];

const currencyLocales: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'en-AE',
};

export function getCurrencyLocale(currency: CurrencyCode) {
  return currencyLocales[currency];
}

export function getCurrencySymbol(currency: CurrencyCode) {
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((part) => part.type === 'currency')
    ?.value ?? currency;
}

export function formatCurrency(value: number, currency: CurrencyCode = 'INR') {
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(
  value: number,
  currency: CurrencyCode = 'INR',
) {
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: 'currency',
    currency,
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
