export type PaymentSource = 'credit_card' | 'debit_card' | 'upi' | 'cash';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  paymentMethodId: string;
  paymentMethodName: string;
  source: PaymentSource;
  date: string;
  note?: string;
  merchant?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentSource;
  isDefault: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
  createdAt: string;
}

export interface UserSettings {
  currency: CurrencyCode;
  theme: ThemePreference;
  updatedAt: string;
}

export interface ExpenseInput {
  amount: number;
  category: string;
  paymentMethodId: string;
  paymentMethodName: string;
  source: PaymentSource;
  date: string;
  note?: string;
  merchant?: string;
}

export interface PaymentMethodInput {
  name: string;
  type: PaymentSource;
}

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
}

export interface BudgetInput {
  category: string;
  limit: number;
  month: string;
}

export interface UserSettingsInput {
  currency: CurrencyCode;
  theme: ThemePreference;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  paymentMethodId?: string;
  source?: string;
}

export interface ChatIntent {
  intent: 'get_expenses' | 'add_expense' | 'budget_status' | 'unknown';
  filters: {
    category: string | null;
    source: string | null;
    paymentMethodName: string | null;
    dateRange: {
      start: string | null;
      end: string | null;
      preset: string | null;
    };
  };
  amount: number | null;
  merchant: string | null;
  note: string | null;
  date: string | null;
  category: string | null;
  source: PaymentSource | null;
  paymentMethodName?: string | null;
}
