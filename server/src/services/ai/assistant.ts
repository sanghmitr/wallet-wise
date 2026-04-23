import {
  endOfMonth,
  format,
  isValid,
  parse,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { env } from '../../config/env.js';
import {
  getBillingCycleRangeForMonth,
  getCurrentBillingCycleRange,
  getPreviousBillingCycleRange,
} from '../../lib/billing-cycles.js';
import { getGeminiClient } from '../../lib/gemini.js';
import type { DataStore } from '../../lib/data-store.js';
import type {
  Budget,
  ChatIntent,
  CurrencyCode,
  Expense,
  ExpenseFilters,
  PaymentMethod,
  PaymentSource,
} from '../../types/domain.js';

const paymentSourceValues = ['credit_card', 'debit_card', 'upi', 'cash'] as const;
const datePresetValues = ['this-month', 'last-30-days', 'last-month'] as const;
const billingCycleModeValues = ['current', 'previous', 'month'] as const;

const nullableStringSchema = {
  anyOf: [{ type: 'string' }, { type: 'null' }],
} as const;

const nullableSourceSchema = {
  anyOf: [{ type: 'string', enum: paymentSourceValues }, { type: 'null' }],
} as const;

const nullablePresetSchema = {
  anyOf: [{ type: 'string', enum: datePresetValues }, { type: 'null' }],
} as const;

const nullableBillingCycleModeSchema = {
  anyOf: [{ type: 'string', enum: billingCycleModeValues }, { type: 'null' }],
} as const;

const intentJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
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
        category: nullableStringSchema,
        source: nullableSourceSchema,
        paymentMethodName: nullableStringSchema,
        billingCycle: {
          type: 'object',
          additionalProperties: false,
          properties: {
            mode: nullableBillingCycleModeSchema,
            referenceMonth: nullableStringSchema,
          },
          required: ['mode', 'referenceMonth'],
        },
        dateRange: {
          type: 'object',
          additionalProperties: false,
          properties: {
            start: nullableStringSchema,
            end: nullableStringSchema,
            preset: nullablePresetSchema,
          },
          required: ['start', 'end', 'preset'],
        },
      },
      required: ['category', 'source', 'paymentMethodName', 'billingCycle', 'dateRange'],
    },
    amount: {
      anyOf: [{ type: 'number' }, { type: 'null' }],
    },
    merchant: nullableStringSchema,
    note: nullableStringSchema,
    date: nullableStringSchema,
    category: nullableStringSchema,
    source: nullableSourceSchema,
    paymentMethodName: nullableStringSchema,
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
    'paymentMethodName',
  ],
} as const;

const categoryKeywordMap: Record<string, string> = {
  zomato: 'Food & Dining',
  swiggy: 'Food & Dining',
  cafe: 'Food & Dining',
  coffee: 'Food & Dining',
  uber: 'Travel',
  ola: 'Travel',
  metro: 'Travel',
  amazon: 'Shopping',
  myntra: 'Shopping',
  rent: 'Rent & Utilities',
  electricity: 'Rent & Utilities',
  bill: 'Rent & Utilities',
  grocery: 'Groceries',
  medicine: 'Health',
  doctor: 'Health',
};

const currencyLocales: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'en-AE',
};

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

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

function buildBillingCycle(mode: 'current' | 'previous' | 'month' | null, referenceMonth: string | null = null) {
  return {
    mode,
    referenceMonth: mode === 'month' ? referenceMonth : null,
  };
}

function inferSource(message: string): PaymentSource | null {
  const lower = message.toLowerCase();

  if (lower.includes('upi') || lower.includes('gpay') || lower.includes('phonepe')) {
    return 'upi';
  }

  if (lower.includes('debit')) {
    return 'debit_card';
  }

  if (lower.includes('credit') || lower.includes('card') || lower.includes('hdfc')) {
    return 'credit_card';
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
    return 'Food & Dining';
  }

  if (lower.includes('travel') || lower.includes('trip')) {
    return 'Travel';
  }

  if (lower.includes('shop')) {
    return 'Shopping';
  }

  if (lower.includes('bill')) {
    return 'Rent & Utilities';
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

function inferBillingCycle(message: string) {
  const lower = message.toLowerCase();

  if (!lower.includes('billing cycle') && !lower.includes('statement cycle')) {
    return buildBillingCycle(null);
  }

  if (/\b(last|previous)\s+billing cycle\b/.test(lower)) {
    return buildBillingCycle('previous');
  }

  if (/\b(this|current)\s+billing cycle\b/.test(lower)) {
    return buildBillingCycle('current');
  }

  const monthMatch = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b(?:\s+(\d{4}))?/,
  );

  if (monthMatch) {
    const parsed = parse(
      `${monthMatch[1]} ${monthMatch[2] || format(new Date(), 'yyyy')}`,
      'MMMM yyyy',
      new Date(),
    );

    if (isValid(parsed)) {
      return buildBillingCycle('month', format(parsed, 'yyyy-MM'));
    }
  }

  return buildBillingCycle('current');
}

function inferPaymentMethodName(message: string, paymentMethods: PaymentMethod[]) {
  const lower = message.toLocaleLowerCase();
  const exactName = paymentMethods.find((paymentMethod) =>
    lower.includes(paymentMethod.name.toLocaleLowerCase()),
  );

  if (exactName) {
    return exactName.name;
  }

  const methodPhraseMatch = message.match(
    /\b(?:using|via|with|from)\s+(.+?)(?:\s+(?:for|on)\b|$)/i,
  );
  const phrase = methodPhraseMatch?.[1]?.trim();

  if (!phrase) {
    return null;
  }

  const normalizedPhrase = normalizeValue(phrase);
  const partial = paymentMethods.find((paymentMethod) =>
    normalizeValue(paymentMethod.name).includes(normalizedPhrase) ||
    normalizedPhrase.includes(normalizeValue(paymentMethod.name)),
  );

  return partial?.name ?? phrase;
}

function normalizeCategoryIntent(
  rawCategory: string | null,
  categories: Array<{ name: string }>,
) {
  if (!rawCategory) {
    return null;
  }

  const normalized = normalizeValue(rawCategory);
  const exact = categories.find((category) => normalizeValue(category.name) === normalized);

  if (exact) {
    return exact.name;
  }

  const partial = categories.find(
    (category) =>
      normalizeValue(category.name).includes(normalized) ||
      normalized.includes(normalizeValue(category.name)),
  );

  if (partial) {
    return partial.name;
  }

  return rawCategory;
}

function normalizePaymentMethodIntent(
  rawPaymentMethodName: string | null | undefined,
  paymentMethods: PaymentMethod[],
) {
  if (!rawPaymentMethodName) {
    return null;
  }

  const normalized = normalizeValue(rawPaymentMethodName);
  const exact = paymentMethods.find(
    (paymentMethod) => normalizeValue(paymentMethod.name) === normalized,
  );

  if (exact) {
    return exact.name;
  }

  const partial = paymentMethods.find(
    (paymentMethod) =>
      normalizeValue(paymentMethod.name).includes(normalized) ||
      normalized.includes(normalizeValue(paymentMethod.name)),
  );

  return partial?.name ?? rawPaymentMethodName;
}

function fallbackIntent(
  message: string,
  categories: Array<{ name: string }>,
  paymentMethods: PaymentMethod[],
): ChatIntent {
  const amountMatch = message.match(/(\d+(?:\.\d{1,2})?)/);
  const lower = message.toLowerCase();
  const category = normalizeCategoryIntent(inferCategory(message), categories);
  const source = inferSource(message);
  const preset = inferDatePreset(message) ?? 'this-month';
  const billingCycle = inferBillingCycle(message);
  const merchantMatch = message.match(/on\s+(.+?)(?:\s+(?:using|via|with)\b|$)/i);
  const paymentMethodName = normalizePaymentMethodIntent(
    inferPaymentMethodName(message, paymentMethods),
    paymentMethods,
  );

  if (amountMatch && /(spent|paid|bought|ordered|booked)/i.test(lower)) {
    return {
      intent: 'add_expense',
      filters: {
        category,
        source,
        paymentMethodName,
        billingCycle,
        dateRange: buildDateRange('this-month'),
      },
      amount: Number(amountMatch[1]),
      merchant: merchantMatch?.[1]?.trim() ?? null,
      note: null,
      date: format(new Date(), 'yyyy-MM-dd'),
      category: category || 'Other',
      source: source || 'credit_card',
      paymentMethodName,
    };
  }

  if (lower.includes('budget') || lower.includes('exceeded')) {
    return {
      intent: 'budget_status',
      filters: {
        category,
        source,
        paymentMethodName,
        billingCycle,
        dateRange: buildDateRange('this-month'),
      },
      amount: null,
      merchant: null,
      note: null,
      date: null,
      category,
      source,
      paymentMethodName,
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
        paymentMethodName,
        billingCycle,
        dateRange: buildDateRange(preset),
      },
      amount: null,
      merchant: null,
      note: null,
      date: null,
      category,
      source,
      paymentMethodName,
    };
  }

  return {
    intent: 'unknown',
      filters: {
        category: null,
        source: null,
        paymentMethodName,
        billingCycle,
        dateRange: buildDateRange('this-month'),
      },
    amount: null,
    merchant: null,
    note: null,
    date: null,
    category: null,
    source: null,
    paymentMethodName,
  };
}

async function extractIntent(
  message: string,
  categories: Array<{ name: string }>,
  paymentMethods: PaymentMethod[],
): Promise<ChatIntent> {
  const client = getGeminiClient();

  if (!client) {
    return fallbackIntent(message, categories, paymentMethods);
  }

  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const response = await client.models.generateContent({
      model: env.geminiModel,
      contents: [
        'You extract intents for an expense manager.',
        `Today is ${today}.`,
        'Return JSON only, matching the provided schema exactly.',
        'Use only the provided categories and payment method names when possible.',
        'Prefer exact category names.',
        'For date presets use only this-month, last-30-days, or last-month.',
        'For billing cycles use mode current, previous, or month.',
        'If the user asks for a named month billing cycle, set mode=month and referenceMonth in YYYY-MM format.',
        'If the user asks for current or last billing cycle, set the billingCycle object and leave dateRange empty.',
        '',
        JSON.stringify({
          availableCategories: categories.map((category) => category.name),
          availablePaymentMethods: paymentMethods.map((paymentMethod) => ({
            name: paymentMethod.name,
            type: paymentMethod.type,
            billingCycleDay: paymentMethod.billingCycleDay ?? null,
          })),
          userMessage: message,
        }),
      ].join('\n'),
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseJsonSchema: intentJsonSchema,
      },
    });

    const raw = response.text?.trim();

    if (!raw) {
      return fallbackIntent(message, categories, paymentMethods);
    }

    const parsed = JSON.parse(raw) as ChatIntent;
    const normalizedCategory = normalizeCategoryIntent(parsed.category, categories);
    const normalizedFilterCategory = normalizeCategoryIntent(
      parsed.filters.category,
      categories,
    );
    const normalizedPaymentMethodName = normalizePaymentMethodIntent(
      parsed.paymentMethodName ?? parsed.filters.paymentMethodName,
      paymentMethods,
    );
    const normalizedBillingCycle =
      parsed.filters.billingCycle?.mode === 'month'
        ? buildBillingCycle(
            'month',
            /^\d{4}-\d{2}$/.test(parsed.filters.billingCycle.referenceMonth || '')
              ? parsed.filters.billingCycle.referenceMonth
              : null,
          )
        : buildBillingCycle(parsed.filters.billingCycle?.mode ?? null);

    return {
      ...parsed,
      category: normalizedCategory,
      paymentMethodName: normalizedPaymentMethodName,
      filters: {
        ...parsed.filters,
        category: normalizedFilterCategory,
        paymentMethodName: normalizedPaymentMethodName,
        billingCycle: normalizedBillingCycle,
      },
    };
  } catch (error) {
    return fallbackIntent(message, categories, paymentMethods);
  }
}

function toExpenseFilters(
  intent: ChatIntent,
  paymentMethodId?: string,
): ExpenseFilters {
  return {
    category: intent.filters.category || undefined,
    source: intent.filters.source || undefined,
    startDate: intent.filters.dateRange.start || undefined,
    endDate: intent.filters.dateRange.end || undefined,
    paymentMethodId,
  };
}

function getBillingCycleScope(intent: ChatIntent, paymentMethod: PaymentMethod) {
  const mode = intent.filters.billingCycle.mode;

  if (!mode || paymentMethod.type !== 'credit_card' || !paymentMethod.billingCycleDay) {
    return null;
  }

  if (mode === 'previous') {
    return getPreviousBillingCycleRange(paymentMethod.billingCycleDay);
  }

  if (mode === 'month' && intent.filters.billingCycle.referenceMonth) {
    return getBillingCycleRangeForMonth(
      paymentMethod.billingCycleDay,
      intent.filters.billingCycle.referenceMonth,
    );
  }

  return getCurrentBillingCycleRange(paymentMethod.billingCycleDay);
}

function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function formatAmount(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildBudgetAlerts(
  expenses: Expense[],
  budgets: Budget[],
  categories: Array<{ name: string; includeInMonthlyBudget: boolean }>,
) {
  const trackedCategoryNames = new Set(
    categories
      .filter((category) => category.includeInMonthlyBudget)
      .map((category) => category.name),
  );

  return budgets
    .filter((budget) => trackedCategoryNames.has(budget.category))
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

function formatExpenseSummary(
  message: string,
  expenses: Expense[],
  budgetAlerts: ReturnType<typeof buildBudgetAlerts>,
  currency: CurrencyCode,
) {
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

  return `I found ${expenses.length} matching transactions totaling ${formatAmount(
    total,
    currency,
  )}. Top category: ${lead?.[0] ?? 'N/A'}.${alertLine}`;
}

function resolvePaymentMethod(
  message: string,
  paymentMethods: PaymentMethod[],
  fallbackType: PaymentSource | null,
) {
  const lower = message.toLocaleLowerCase();

  const exactName = paymentMethods.find((paymentMethod) =>
    lower.includes(paymentMethod.name.toLocaleLowerCase()),
  );

  if (exactName) {
    return exactName;
  }

  if (fallbackType) {
    const byType = paymentMethods.find(
      (paymentMethod) => paymentMethod.type === fallbackType,
    );

    if (byType) {
      return byType;
    }
  }

  return paymentMethods[0] ?? null;
}

async function generateResponse(
  message: string,
  expenses: Expense[],
  budgetAlerts: ReturnType<typeof buildBudgetAlerts>,
  currency: CurrencyCode,
) {
  const client = getGeminiClient();

  if (!client) {
    return formatExpenseSummary(message, expenses, budgetAlerts, currency);
  }

  try {
    const total = sumExpenses(expenses);
    const topCategory =
      Object.entries(
        expenses.reduce<Record<string, number>>((accumulator, expense) => {
          accumulator[expense.category] =
            (accumulator[expense.category] || 0) + expense.amount;
          return accumulator;
        }, {}),
      ).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

    const response = await client.models.generateContent({
      model: env.geminiModel,
      contents: [
        'You are a polished finance assistant inside an expense tracker.',
        'Answer clearly and naturally, like a concise ChatGPT reply.',
        'Be grounded in the provided ledger data only.',
        'Mention budget risk when relevant.',
        'If no matches are found, say that plainly and suggest a more specific follow-up.',
        '',
        JSON.stringify({
          query: message,
          currency,
          summary: {
            count: expenses.length,
            total,
            topCategory,
          },
          expenses: expenses.slice(0, 8).map((expense) => ({
            amount: expense.amount,
            category: expense.category,
            paymentMethodName: expense.paymentMethodName,
            date: expense.date,
            merchant: expense.merchant ?? null,
            note: expense.note ?? null,
          })),
          budgetAlerts,
        }),
      ].join('\n'),
      config: {
        temperature: 0.35,
      },
    });

    return response.text?.trim() || formatExpenseSummary(message, expenses, budgetAlerts, currency);
  } catch (error) {
    return formatExpenseSummary(message, expenses, budgetAlerts, currency);
  }
}

function buildUnknownResponse() {
  return [
    'I can help with spend summaries, card or UPI usage, budget checks, and quick expense entry.',
    "Try asking things like 'How much did I spend this month?', 'Show HDFC Credit Card expenses for current billing cycle', or 'I spent 450 on Zomato using HDFC Credit Card'.",
  ].join(' ');
}

export async function handleAssistantMessage(
  store: DataStore,
  userId: string,
  message: string,
) {
  const categories = await store.listCategories(userId);
  const paymentMethods = await store.listPaymentMethods(userId);
  const intent = await extractIntent(message, categories, paymentMethods);
  const month = format(new Date(), 'yyyy-MM');
  const budgets = await store.listBudgets(userId, month);
  const settings = await store.getSettings(userId);

  if (intent.intent === 'unknown') {
    return {
      intent,
      matches: [],
      budgetAlerts: [],
      response: buildUnknownResponse(),
    };
  }

  if (intent.intent === 'add_expense' && intent.amount) {
    const paymentMethod = resolvePaymentMethod(
      intent.paymentMethodName || message,
      paymentMethods,
      intent.source,
    );

    if (!paymentMethod) {
      throw new Error('Add a payment method in Profile before adding expenses.');
    }

    const expense = await store.createExpense(userId, {
      amount: intent.amount,
      category: intent.category || 'Other',
      paymentMethodId: paymentMethod.id,
      paymentMethodName: paymentMethod.name,
      source: paymentMethod.type,
      date: intent.date || format(new Date(), 'yyyy-MM-dd'),
      merchant: intent.merchant || undefined,
      note: intent.note || intent.merchant || undefined,
    });

    return {
      intent,
      expense,
      matches: [expense],
      budgetAlerts: [],
      response: `Added ${expense.category} expense for ${formatAmount(
        expense.amount,
        settings.currency,
      )}${expense.merchant ? ` at ${expense.merchant}` : ''}.`,
    };
  }

  const requestedPaymentMethodName =
    intent.filters.paymentMethodName || intent.paymentMethodName || null;
  const resolvedPaymentMethod = requestedPaymentMethodName
    ? resolvePaymentMethod(
        requestedPaymentMethodName,
        paymentMethods,
        intent.source,
      )
    : null;

  if (intent.filters.billingCycle.mode && !requestedPaymentMethodName) {
    return {
      intent,
      matches: [],
      budgetAlerts: [],
      response:
        'Tell me which credit card you want to review for that billing cycle, for example: "Show HDFC Credit Card expenses for current billing cycle."',
    };
  }

  if (
    intent.filters.billingCycle.mode &&
    (!resolvedPaymentMethod ||
      resolvedPaymentMethod.type !== 'credit_card' ||
      !resolvedPaymentMethod.billingCycleDay)
  ) {
    return {
      intent,
      matches: [],
      budgetAlerts: [],
      response: `${requestedPaymentMethodName || 'That card'} does not have a billing cycle configured yet. Add its billing cycle day in Profile first.`,
    };
  }

  const billingCycleScope =
    resolvedPaymentMethod && intent.filters.billingCycle.mode
      ? getBillingCycleScope(intent, resolvedPaymentMethod)
      : null;

  const expenseFilters = {
    ...toExpenseFilters(intent, resolvedPaymentMethod?.id),
    startDate: billingCycleScope?.start || intent.filters.dateRange.start || undefined,
    endDate: billingCycleScope?.end || intent.filters.dateRange.end || undefined,
  };

  const expenses = await store.listExpenses(userId, expenseFilters);
  const budgetAlerts = buildBudgetAlerts(expenses, budgets, categories);
  const response = await generateResponse(
    message,
    expenses,
    budgetAlerts,
    settings.currency,
  );

  const responseWithScope = billingCycleScope
    ? `Billing cycle ${format(billingCycleScope.startDate, 'd MMM')} to ${format(
        billingCycleScope.endDate,
        'd MMM',
      )}. ${response}`
    : response;

  return {
    intent,
    matches: expenses,
    budgetAlerts,
    response: responseWithScope,
  };
}
