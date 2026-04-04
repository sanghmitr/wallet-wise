import { endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns';
import { env } from '../../config/env.js';
import { getOpenAIClient } from '../../lib/openai.js';
import type { DataStore } from '../../lib/data-store.js';
import type {
  Budget,
  ChatIntent,
  Expense,
  ExpenseFilters,
  PaymentSource,
} from '../../types/domain.js';

const categoryKeywordMap: Record<string, string> = {
  zomato: 'Food',
  swiggy: 'Food',
  cafe: 'Food',
  uber: 'Travel',
  ola: 'Travel',
  metro: 'Travel',
  amazon: 'Shopping',
  myntra: 'Shopping',
  rent: 'Bills',
  electricity: 'Bills',
  bill: 'Bills',
};

function buildDateRange(preset: string | null) {
  const now = new Date();

  if (preset === 'this-month') {
    return {
      start: format(startOfMonth(now), 'yyyy-MM-dd'),
      end: format(endOfMonth(now), 'yyyy-MM-dd'),
      preset,
    };
  }

  if (preset === 'last-30-days') {
    return {
      start: format(subDays(now, 29), 'yyyy-MM-dd'),
      end: format(now, 'yyyy-MM-dd'),
      preset,
    };
  }

  if (preset === 'last-month') {
    const previous = subMonths(now, 1);
    return {
      start: format(startOfMonth(previous), 'yyyy-MM-dd'),
      end: format(endOfMonth(previous), 'yyyy-MM-dd'),
      preset,
    };
  }

  return {
    start: null,
    end: null,
    preset: null,
  };
}

function inferSource(message: string): PaymentSource | null {
  const lower = message.toLowerCase();

  if (lower.includes('upi') || lower.includes('gpay') || lower.includes('phonepe')) {
    return 'upi';
  }

  if (lower.includes('debit')) {
    return 'debit';
  }

  if (lower.includes('credit') || lower.includes('card') || lower.includes('hdfc')) {
    return 'credit';
  }

  if (lower.includes('cash')) {
    return 'cash';
  }

  return null;
}

function inferCategory(message: string): string | null {
  const lower = message.toLowerCase();

  for (const [keyword, category] of Object.entries(categoryKeywordMap)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }

  if (lower.includes('food') || lower.includes('dinner')) {
    return 'Food';
  }

  if (lower.includes('travel') || lower.includes('trip')) {
    return 'Travel';
  }

  if (lower.includes('shop')) {
    return 'Shopping';
  }

  if (lower.includes('bill')) {
    return 'Bills';
  }

  return null;
}

function inferDatePreset(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes('this month')) {
    return 'this-month';
  }

  if (lower.includes('last 30 days')) {
    return 'last-30-days';
  }

  if (lower.includes('last month')) {
    return 'last-month';
  }

  return null;
}

function fallbackIntent(message: string): ChatIntent {
  const amountMatch = message.match(/(\d+(?:\.\d{1,2})?)/);
  const lower = message.toLowerCase();
  const category = inferCategory(message);
  const source = inferSource(message);
  const preset = inferDatePreset(message) ?? 'this-month';
  const merchantMatch = message.match(/on\s+(.+?)(?:\s+(?:using|via|with)\b|$)/i);

  if (amountMatch && /(spent|paid|bought|ordered|booked)/i.test(lower)) {
    return {
      intent: 'add_expense',
      filters: {
        category: category,
        source,
        dateRange: buildDateRange('this-month'),
      },
      amount: Number(amountMatch[1]),
      merchant: merchantMatch?.[1]?.trim() ?? null,
      note: null,
      date: format(new Date(), 'yyyy-MM-dd'),
      category: category || 'Other',
      source: source || 'credit',
    };
  }

  if (lower.includes('budget') || lower.includes('exceeded')) {
    return {
      intent: 'budget_status',
      filters: {
        category,
        source,
        dateRange: buildDateRange('this-month'),
      },
      amount: null,
      merchant: null,
      note: null,
      date: null,
      category,
      source,
    };
  }

  if (
    /(show|summary|spent|total|how much|usage|transactions|expenses)/i.test(lower)
  ) {
    return {
      intent: 'get_expenses',
      filters: {
        category,
        source,
        dateRange: buildDateRange(preset),
      },
      amount: null,
      merchant: null,
      note: null,
      date: null,
      category,
      source,
    };
  }

  return {
    intent: 'unknown',
    filters: {
      category: null,
      source: null,
      dateRange: buildDateRange('this-month'),
    },
    amount: null,
    merchant: null,
    note: null,
    date: null,
    category: null,
    source: null,
  };
}

async function extractIntent(message: string): Promise<ChatIntent> {
  const client = getOpenAIClient();

  if (!client) {
    return fallbackIntent(message);
  }

  try {
    const completion = await client.chat.completions.create({
      model: env.openAiModel,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'expense_chat_intent',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              intent: {
                type: 'string',
                enum: ['get_expenses', 'add_expense', 'budget_status', 'unknown'],
              },
              filters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  category: { type: ['string', 'null'] },
                  source: { type: ['string', 'null'] },
                  dateRange: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      start: { type: ['string', 'null'] },
                      end: { type: ['string', 'null'] },
                      preset: { type: ['string', 'null'] },
                    },
                    required: ['start', 'end', 'preset'],
                  },
                },
                required: ['category', 'source', 'dateRange'],
              },
              amount: { type: ['number', 'null'] },
              merchant: { type: ['string', 'null'] },
              note: { type: ['string', 'null'] },
              date: { type: ['string', 'null'] },
              category: { type: ['string', 'null'] },
              source: { type: ['string', 'null'] },
            },
            required: [
              'intent',
              'filters',
              'amount',
              'merchant',
              'note',
              'date',
              'category',
              'source',
            ],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You extract finance-app intents. Return JSON only. Categories should prefer Food, Travel, Shopping, Bills, Other when uncertain. For date presets use this-month, last-30-days, or last-month.',
        },
        { role: 'user', content: message },
      ],
    });

    const raw = completion.choices[0]?.message.content;

    if (!raw) {
      return fallbackIntent(message);
    }

    return JSON.parse(raw) as ChatIntent;
  } catch (error) {
    return fallbackIntent(message);
  }
}

function toExpenseFilters(intent: ChatIntent): ExpenseFilters {
  return {
    category: intent.filters.category || undefined,
    source: intent.filters.source || undefined,
    startDate: intent.filters.dateRange.start || undefined,
    endDate: intent.filters.dateRange.end || undefined,
  };
}

function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function buildBudgetAlerts(expenses: Expense[], budgets: Budget[]) {
  return budgets
    .map((budget) => {
      const spent = sumExpenses(
        expenses.filter((expense) => expense.category === budget.category),
      );
      const usage = budget.limit > 0 ? spent / budget.limit : 0;

      return {
        category: budget.category,
        spent,
        limit: budget.limit,
        usage,
      };
    })
    .filter((item) => item.usage >= 0.8)
    .sort((left, right) => right.usage - left.usage);
}

function formatExpenseSummary(message: string, expenses: Expense[], budgetAlerts: ReturnType<typeof buildBudgetAlerts>) {
  if (!expenses.length) {
    return 'No matching expenses were found for that request.';
  }

  const total = sumExpenses(expenses);
  const topCategory = expenses.reduce<Record<string, number>>((accumulator, expense) => {
    accumulator[expense.category] = (accumulator[expense.category] || 0) + expense.amount;
    return accumulator;
  }, {});

  const lead = Object.entries(topCategory).sort((left, right) => right[1] - left[1])[0];
  const alertLine = budgetAlerts.length
    ? ` Budget risk: ${budgetAlerts
        .map((alert) => `${alert.category} is at ${Math.round(alert.usage * 100)}%`)
        .join(', ')}.`
    : '';

  return `I found ${expenses.length} matching transactions totaling INR ${total.toFixed(
    2,
  )}. Top category: ${lead?.[0] ?? 'N/A'}.${alertLine}`;
}

async function generateResponse(message: string, expenses: Expense[], budgetAlerts: ReturnType<typeof buildBudgetAlerts>) {
  const client = getOpenAIClient();

  if (!client) {
    return formatExpenseSummary(message, expenses, budgetAlerts);
  }

  try {
    const completion = await client.chat.completions.create({
      model: env.openAiModel,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise finance assistant. Summarize the result in 2-4 sentences and mention budget risk when relevant.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            query: message,
            expenses: expenses.slice(0, 20),
            budgetAlerts,
          }),
        },
      ],
    });

    return (
      completion.choices[0]?.message.content ||
      formatExpenseSummary(message, expenses, budgetAlerts)
    );
  } catch (error) {
    return formatExpenseSummary(message, expenses, budgetAlerts);
  }
}

export async function handleAssistantMessage(
  store: DataStore,
  userId: string,
  message: string,
) {
  const intent = await extractIntent(message);
  const month = format(new Date(), 'yyyy-MM');
  const budgets = await store.listBudgets(userId, month);

  if (intent.intent === 'add_expense' && intent.amount) {
    const expense = await store.createExpense(userId, {
      amount: intent.amount,
      category: intent.category || 'Other',
      source: intent.source || 'credit',
      date: intent.date || format(new Date(), 'yyyy-MM-dd'),
      merchant: intent.merchant || undefined,
      note: intent.note || intent.merchant || undefined,
    });

    return {
      intent,
      expense,
      matches: [expense],
      budgetAlerts: [],
      response: `Added ${expense.category} expense for INR ${expense.amount.toFixed(
        2,
      )}${expense.merchant ? ` at ${expense.merchant}` : ''}.`,
    };
  }

  const expenses = await store.listExpenses(userId, toExpenseFilters(intent));
  const budgetAlerts = buildBudgetAlerts(expenses, budgets);
  const response = await generateResponse(message, expenses, budgetAlerts);

  return {
    intent,
    matches: expenses,
    budgetAlerts,
    response,
  };
}
