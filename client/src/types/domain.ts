export type PaymentSource = 'credit' | 'debit' | 'upi' | 'cash';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  source: PaymentSource;
  date: string;
  note?: string;
  merchant?: string;
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

export interface ExpenseInput {
  amount: number;
  category: string;
  source: PaymentSource;
  date: string;
  note?: string;
  merchant?: string;
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

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  source?: PaymentSource | 'all';
  category?: string;
}

export type DashboardPreset = 'this-month' | 'last-30-days' | 'all-time';

export interface ChatIntent {
  intent: 'get_expenses' | 'add_expense' | 'budget_status' | 'unknown';
  filters: {
    category: string | null;
    source: string | null;
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
}

export interface ChatResponsePayload {
  response: string;
  intent: ChatIntent;
  expense?: Expense;
  matches?: Expense[];
  budgetAlerts?: Array<{
    category: string;
    spent: number;
    limit: number;
    usage: number;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}
