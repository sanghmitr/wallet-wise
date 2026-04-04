import { randomUUID } from 'node:crypto';
import {
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  subDays,
} from 'date-fns';
import type { Firestore } from 'firebase-admin/firestore';
import { env } from '../config/env.js';
import { getFirestoreClient } from './firebase.js';
import type {
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  CurrencyCode,
  Expense,
  ExpenseFilters,
  ExpenseInput,
  PaymentMethod,
  PaymentMethodInput,
  PaymentSource,
  ThemePreference,
  UserSettings,
  UserSettingsInput,
} from '../types/domain.js';

interface UserData {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  paymentMethods: PaymentMethod[];
  settings: UserSettings;
}

export interface DataStore {
  listExpenses(userId: string, filters?: ExpenseFilters): Promise<Expense[]>;
  createExpense(userId: string, input: ExpenseInput): Promise<Expense>;
  updateExpense(userId: string, expenseId: string, input: ExpenseInput): Promise<Expense>;
  deleteExpense(userId: string, expenseId: string): Promise<void>;
  listCategories(userId: string): Promise<Category[]>;
  createCategory(userId: string, input: CategoryInput): Promise<Category>;
  updateCategory(userId: string, categoryId: string, input: CategoryInput): Promise<Category>;
  deleteCategory(userId: string, categoryId: string): Promise<void>;
  listBudgets(userId: string, month?: string): Promise<Budget[]>;
  upsertBudget(userId: string, input: BudgetInput): Promise<Budget>;
  listPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  createPaymentMethod(userId: string, input: PaymentMethodInput): Promise<PaymentMethod>;
  updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    input: PaymentMethodInput,
  ): Promise<PaymentMethod>;
  deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
  getSettings(userId: string): Promise<UserSettings>;
  updateSettings(userId: string, input: UserSettingsInput): Promise<UserSettings>;
}

const defaultCategories: Array<Omit<Category, 'id' | 'createdAt'>> = [
  { name: 'Food & Dining', icon: 'restaurant', color: '#bf7b77', isDefault: true },
  { name: 'Groceries', icon: 'shopping_cart', color: '#a79892', isDefault: true },
  { name: 'Travel', icon: 'directions_car', color: '#7a8799', isDefault: true },
  { name: 'Leisure', icon: 'movie', color: '#7a778f', isDefault: true },
  { name: 'Rent & Utilities', icon: 'home_work', color: '#5f5e5e', isDefault: true },
  { name: 'Shopping', icon: 'shopping_bag', color: '#8d847f', isDefault: true },
  { name: 'Health', icon: 'medical_services', color: '#b56d69', isDefault: true },
  { name: 'Other', icon: 'inventory_2', color: '#8c8a84', isDefault: true },
];

const defaultPaymentMethods: Array<Omit<PaymentMethod, 'id' | 'createdAt'>> = [
  { name: 'HDFC Credit Card', type: 'credit_card', isDefault: true },
  { name: 'SBI Debit Card', type: 'debit_card', isDefault: true },
  { name: 'personal@upi', type: 'upi', isDefault: true },
  { name: 'Cash Wallet', type: 'cash', isDefault: true },
];

const defaultSettings: UserSettingsInput = {
  currency: 'INR',
  theme: 'system',
};

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function createDefaultCategories() {
  return defaultCategories.map((category) => ({
    ...category,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }));
}

function createDefaultPaymentMethods() {
  return defaultPaymentMethods.map((paymentMethod) => ({
    ...paymentMethod,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }));
}

function mergeMissingDefaultCategories(categories: Category[]) {
  const existingNames = new Set(categories.map((category) => normalizeName(category.name)));
  const missing = defaultCategories
    .filter((category) => !existingNames.has(normalizeName(category.name)))
    .map((category) => ({
      ...category,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }));

  return missing.length ? [...categories, ...missing] : categories;
}

function mergeMissingDefaultPaymentMethods(paymentMethods: PaymentMethod[]) {
  const existingNames = new Set(
    paymentMethods.map((paymentMethod) => normalizeName(paymentMethod.name)),
  );
  const missing = defaultPaymentMethods
    .filter((paymentMethod) => !existingNames.has(normalizeName(paymentMethod.name)))
    .map((paymentMethod) => ({
      ...paymentMethod,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }));

  return missing.length ? [...paymentMethods, ...missing] : paymentMethods;
}

function getDefaultPaymentMethodByType(
  paymentMethods: PaymentMethod[],
  type: PaymentSource,
) {
  return (
    paymentMethods.find((paymentMethod) => paymentMethod.type === type) ??
    paymentMethods[0]
  );
}

function createDemoExpenses(paymentMethods: PaymentMethod[]): Expense[] {
  const today = new Date();
  const currentMonth = format(today, 'yyyy-MM');
  const upi = getDefaultPaymentMethodByType(paymentMethods, 'upi');
  const credit = getDefaultPaymentMethodByType(paymentMethods, 'credit_card');
  const debit = getDefaultPaymentMethodByType(paymentMethods, 'debit_card');
  const cash = getDefaultPaymentMethodByType(paymentMethods, 'cash');

  const expenses: Expense[] = [
    {
      id: randomUUID(),
      amount: 450,
      category: 'Food & Dining',
      paymentMethodId: upi.id,
      paymentMethodName: upi.name,
      source: upi.type,
      date: `${currentMonth}-02`,
      note: 'Zomato dinner',
      merchant: 'Zomato',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 1540,
      category: 'Groceries',
      paymentMethodId: credit.id,
      paymentMethodName: credit.name,
      source: credit.type,
      date: `${currentMonth}-06`,
      note: 'Blue Tokai coffee beans',
      merchant: 'Blue Tokai',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 420,
      category: 'Travel',
      paymentMethodId: upi.id,
      paymentMethodName: upi.name,
      source: upi.type,
      date: `${currentMonth}-08`,
      note: 'Uber trip',
      merchant: 'Uber',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 2850,
      category: 'Shopping',
      paymentMethodId: credit.id,
      paymentMethodName: credit.name,
      source: credit.type,
      date: `${currentMonth}-12`,
      note: 'Apartment essentials',
      merchant: 'IKEA',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 4999,
      category: 'Rent & Utilities',
      paymentMethodId: debit.id,
      paymentMethodName: debit.name,
      source: debit.type,
      date: `${currentMonth}-14`,
      note: 'Electricity bill',
      merchant: 'BESCOM',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 900,
      category: 'Leisure',
      paymentMethodId: cash.id,
      paymentMethodName: cash.name,
      source: cash.type,
      date: `${currentMonth}-15`,
      note: 'Movie night',
      merchant: 'PVR',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 680,
      category: 'Health',
      paymentMethodId: debit.id,
      paymentMethodName: debit.name,
      source: debit.type,
      date: `${currentMonth}-17`,
      note: 'Pharmacy order',
      merchant: 'Apollo Pharmacy',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 760,
      category: 'Travel',
      paymentMethodId: upi.id,
      paymentMethodName: upi.name,
      source: upi.type,
      date: format(subDays(today, 32), 'yyyy-MM-dd'),
      note: 'Airport metro',
      merchant: 'Metro',
      createdAt: today.toISOString(),
    },
  ];

  return expenses.sort((left, right) => right.date.localeCompare(left.date));
}

function createDemoBudgets() {
  const month = format(new Date(), 'yyyy-MM');

  return [
    { id: randomUUID(), category: 'Food & Dining', limit: 6000, month, createdAt: new Date().toISOString() },
    { id: randomUUID(), category: 'Groceries', limit: 4500, month, createdAt: new Date().toISOString() },
    { id: randomUUID(), category: 'Travel', limit: 3500, month, createdAt: new Date().toISOString() },
    { id: randomUUID(), category: 'Leisure', limit: 2500, month, createdAt: new Date().toISOString() },
    { id: randomUUID(), category: 'Rent & Utilities', limit: 12000, month, createdAt: new Date().toISOString() },
    { id: randomUUID(), category: 'Shopping', limit: 5000, month, createdAt: new Date().toISOString() },
    { id: randomUUID(), category: 'Health', limit: 2000, month, createdAt: new Date().toISOString() },
    { id: randomUUID(), category: 'Other', limit: 2500, month, createdAt: new Date().toISOString() },
  ];
}

function matchesFilters(expense: Expense, filters?: ExpenseFilters) {
  if (!filters) {
    return true;
  }

  if (filters.category && expense.category !== filters.category) {
    return false;
  }

  if (
    filters.paymentMethodId &&
    filters.paymentMethodId !== 'all' &&
    expense.paymentMethodId !== filters.paymentMethodId
  ) {
    return false;
  }

  if (filters.source && expense.source !== filters.source && expense.paymentMethodName !== filters.source) {
    return false;
  }

  const date = parseISO(expense.date);

  if (filters.startDate && isBefore(date, parseISO(filters.startDate))) {
    return false;
  }

  if (filters.endDate && isAfter(date, parseISO(filters.endDate))) {
    return false;
  }

  return true;
}

function normalizeLegacyExpense(
  expense: Expense | (Partial<Expense> & { source?: PaymentSource }),
  paymentMethods: PaymentMethod[],
) {
  if (
    expense.paymentMethodId &&
    expense.paymentMethodName &&
    expense.source &&
    paymentMethods.some((paymentMethod) => paymentMethod.id === expense.paymentMethodId)
  ) {
    return expense as Expense;
  }

  const fallbackType = expense.source || 'cash';
  const fallbackMethod = getDefaultPaymentMethodByType(paymentMethods, fallbackType);

  return {
    id: expense.id || randomUUID(),
    amount: expense.amount || 0,
    category: expense.category || 'Other',
    paymentMethodId: fallbackMethod.id,
    paymentMethodName: fallbackMethod.name,
    source: fallbackMethod.type,
    date: expense.date || format(new Date(), 'yyyy-MM-dd'),
    note: expense.note,
    merchant: expense.merchant,
    createdAt: expense.createdAt || new Date().toISOString(),
  } satisfies Expense;
}

function normalizeSettings(
  settings?: Partial<UserSettings> | null,
): UserSettings {
  return {
    currency: (settings?.currency as CurrencyCode | undefined) || defaultSettings.currency,
    theme: (settings?.theme as ThemePreference | undefined) || defaultSettings.theme,
    updatedAt:
      typeof settings?.updatedAt === 'string'
        ? settings.updatedAt
        : new Date().toISOString(),
  };
}

class MemoryStore implements DataStore {
  private users = new Map<string, UserData>();

  private getUserData(userId: string): UserData {
    const existing = this.users.get(userId);

    if (existing) {
      existing.categories = mergeMissingDefaultCategories(existing.categories);
      existing.paymentMethods = mergeMissingDefaultPaymentMethods(
        existing.paymentMethods,
      );
      existing.settings = normalizeSettings(existing.settings);
      existing.expenses = existing.expenses.map((expense) =>
        normalizeLegacyExpense(expense, existing.paymentMethods),
      );
      return existing;
    }

    const paymentMethods = createDefaultPaymentMethods();
    const created: UserData = {
      categories: createDefaultCategories(),
      paymentMethods,
      expenses: createDemoExpenses(paymentMethods),
      budgets: createDemoBudgets(),
      settings: normalizeSettings(),
    };

    this.users.set(userId, created);
    return created;
  }

  async listExpenses(userId: string, filters?: ExpenseFilters) {
    return this.getUserData(userId).expenses.filter((expense) =>
      matchesFilters(expense, filters),
    );
  }

  async createExpense(userId: string, input: ExpenseInput) {
    const expense: Expense = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };

    const data = this.getUserData(userId);
    data.expenses.unshift(expense);
    return expense;
  }

  async updateExpense(userId: string, expenseId: string, input: ExpenseInput) {
    const data = this.getUserData(userId);
    const current = data.expenses.find((expense) => expense.id === expenseId);

    if (!current) {
      throw new Error('Expense not found');
    }

    const updated = { ...current, ...input };
    data.expenses = data.expenses.map((expense) =>
      expense.id === expenseId ? updated : expense,
    );

    return updated;
  }

  async deleteExpense(userId: string, expenseId: string) {
    const data = this.getUserData(userId);
    data.expenses = data.expenses.filter((expense) => expense.id !== expenseId);
  }

  async listCategories(userId: string) {
    return this.getUserData(userId).categories.sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  async createCategory(userId: string, input: CategoryInput) {
    const category: Category = {
      id: randomUUID(),
      ...input,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const data = this.getUserData(userId);
    data.categories.push(category);
    return category;
  }

  async updateCategory(userId: string, categoryId: string, input: CategoryInput) {
    const data = this.getUserData(userId);
    const current = data.categories.find((category) => category.id === categoryId);

    if (!current) {
      throw new Error('Category not found');
    }

    const updated = { ...current, ...input };
    data.categories = data.categories.map((category) =>
      category.id === categoryId ? updated : category,
    );

    return updated;
  }

  async deleteCategory(userId: string, categoryId: string) {
    const data = this.getUserData(userId);
    data.categories = data.categories.filter((category) => category.id !== categoryId);
  }

  async listBudgets(userId: string, month?: string) {
    return this.getUserData(userId).budgets.filter((budget) =>
      month ? budget.month === month : true,
    );
  }

  async upsertBudget(userId: string, input: BudgetInput) {
    const data = this.getUserData(userId);
    const existing = data.budgets.find(
      (budget) => budget.category === input.category && budget.month === input.month,
    );

    if (existing) {
      existing.limit = input.limit;
      return existing;
    }

    const created: Budget = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    data.budgets.push(created);
    return created;
  }

  async listPaymentMethods(userId: string) {
    return this.getUserData(userId).paymentMethods.sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  async createPaymentMethod(userId: string, input: PaymentMethodInput) {
    const paymentMethod: PaymentMethod = {
      id: randomUUID(),
      ...input,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const data = this.getUserData(userId);
    data.paymentMethods.push(paymentMethod);
    return paymentMethod;
  }

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    input: PaymentMethodInput,
  ) {
    const data = this.getUserData(userId);
    const current = data.paymentMethods.find(
      (paymentMethod) => paymentMethod.id === paymentMethodId,
    );

    if (!current) {
      throw new Error('Payment method not found');
    }

    const updated = { ...current, ...input };
    data.paymentMethods = data.paymentMethods.map((paymentMethod) =>
      paymentMethod.id === paymentMethodId ? updated : paymentMethod,
    );
    data.expenses = data.expenses.map((expense) =>
      expense.paymentMethodId === paymentMethodId
        ? {
            ...expense,
            paymentMethodName: updated.name,
            source: updated.type,
          }
        : expense,
    );

    return updated;
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    const data = this.getUserData(userId);
    const isReferenced = data.expenses.some(
      (expense) => expense.paymentMethodId === paymentMethodId,
    );

    if (isReferenced) {
      throw new Error(
        'This payment method is used by one or more transactions and cannot be deleted yet.',
      );
    }

    data.paymentMethods = data.paymentMethods.filter(
      (paymentMethod) => paymentMethod.id !== paymentMethodId,
    );
  }

  async getSettings(userId: string) {
    return this.getUserData(userId).settings;
  }

  async updateSettings(userId: string, input: UserSettingsInput) {
    const data = this.getUserData(userId);
    data.settings = normalizeSettings({
      ...data.settings,
      ...input,
      updatedAt: new Date().toISOString(),
    });
    return data.settings;
  }
}

class FirestoreStore implements DataStore {
  private paymentMethodSeedTasks = new Map<string, Promise<void>>();

  constructor(private readonly db: Firestore) {}

  private usersRef() {
    return this.db.collection('users');
  }

  private expensesRef(userId: string) {
    return this.usersRef().doc(userId).collection('expenses');
  }

  private categoriesRef(userId: string) {
    return this.usersRef().doc(userId).collection('categories');
  }

  private budgetsRef(userId: string) {
    return this.usersRef().doc(userId).collection('budgets');
  }

  private paymentMethodsRef(userId: string) {
    return this.usersRef().doc(userId).collection('paymentMethods');
  }

  private settingsRef(userId: string) {
    return this.usersRef().doc(userId).collection('settings').doc('preferences');
  }

  private mapDoc<T extends Record<string, unknown>>(id: string, data: T) {
    return {
      id,
      ...data,
      createdAt:
        typeof data.createdAt === 'string'
          ? data.createdAt
          : (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.().toISOString() ??
            new Date().toISOString(),
    };
  }

  private firestoreTimeoutMessage(action: string) {
    return [
      `Firestore request timed out while trying to ${action}.`,
      'Check that Firestore is enabled, the service account credentials are valid, and your server can reach Google Firestore.',
    ].join(' ');
  }

  private async withTimeout<T>(action: string, task: Promise<T>) {
    return Promise.race([
      task,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(this.firestoreTimeoutMessage(action)));
        }, env.firestoreTimeoutMs);
      }),
    ]);
  }

  private async ensureUserDoc(userId: string) {
    await this.withTimeout(
      'prepare the Firestore user document',
      this.usersRef()
        .doc(userId)
        .set(
          {
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        ),
    );
  }

  private async ensureDefaultCategories(userId: string) {
    await this.ensureUserDoc(userId);
    const snapshot = await this.withTimeout(
      'read category defaults from Firestore',
      this.categoriesRef(userId).get(),
    );
    const existingNames = new Set(
      snapshot.docs.map((doc) =>
        normalizeName(((doc.data() as Partial<Category>).name || '')),
      ),
    );
    const missingDefaults = defaultCategories.filter(
      (category) => !existingNames.has(normalizeName(category.name)),
    );

    if (!missingDefaults.length) {
      return;
    }

    const batch = this.db.batch();
    missingDefaults.forEach((category) => {
      const created = {
        ...category,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };
      batch.set(this.categoriesRef(userId).doc(created.id), created);
    });
    await this.withTimeout('seed default categories in Firestore', batch.commit());
  }

  private async ensureDefaultPaymentMethods(userId: string) {
    const existingTask = this.paymentMethodSeedTasks.get(userId);

    if (existingTask) {
      await existingTask;
      return;
    }

    const task = (async () => {
      await this.ensureUserDoc(userId);
      const snapshot = await this.withTimeout(
        'read payment methods from Firestore',
        this.paymentMethodsRef(userId).get(),
      );
      const paymentMethodDocs = snapshot.docs.map((doc) => ({
        ref: doc.ref,
        value: this.mapDoc(doc.id, doc.data()) as PaymentMethod,
      }));
      const paymentMethodsByName = new Map<
        string,
        Array<{ ref: FirebaseFirestore.DocumentReference; value: PaymentMethod }>
      >();

      paymentMethodDocs.forEach((paymentMethod) => {
        const key = normalizeName(paymentMethod.value.name);
        const group = paymentMethodsByName.get(key) ?? [];
        group.push(paymentMethod);
        paymentMethodsByName.set(key, group);
      });

      const missingDefaults = defaultPaymentMethods.filter(
        (paymentMethod) =>
          !paymentMethodsByName.has(normalizeName(paymentMethod.name)),
      );
      const duplicateGroups = Array.from(paymentMethodsByName.values()).filter(
        (group) => group.length > 1,
      );

      if (!missingDefaults.length && !duplicateGroups.length) {
        return;
      }

      const batch = this.db.batch();

      missingDefaults.forEach((paymentMethod) => {
        const created = {
          ...paymentMethod,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
        };
        batch.set(this.paymentMethodsRef(userId).doc(created.id), created);
      });

      for (const group of duplicateGroups) {
        const [canonical, ...duplicates] = [...group].sort((left, right) =>
          left.value.createdAt.localeCompare(right.value.createdAt),
        );

        for (const duplicate of duplicates) {
          const expenseSnapshot = await this.withTimeout(
            'load expenses linked to duplicate payment methods in Firestore',
            this.expensesRef(userId)
              .where('paymentMethodId', '==', duplicate.value.id)
              .get(),
          );

          expenseSnapshot.docs.forEach((expenseDoc) => {
            batch.set(expenseDoc.ref, {
              ...(expenseDoc.data() as Expense),
              paymentMethodId: canonical.value.id,
              paymentMethodName: canonical.value.name,
              source: canonical.value.type,
            });
          });

          batch.delete(duplicate.ref);
        }
      }

      await this.withTimeout(
        'repair payment method defaults in Firestore',
        batch.commit(),
      );
    })().finally(() => {
      this.paymentMethodSeedTasks.delete(userId);
    });

    this.paymentMethodSeedTasks.set(userId, task);
    await task;
  }

  private async ensureDefaultSettings(userId: string) {
    await this.ensureUserDoc(userId);
    const ref = this.settingsRef(userId);
    const snapshot = await this.withTimeout(
      'read user settings from Firestore',
      ref.get(),
    );

    if (snapshot.exists) {
      return;
    }

    await this.withTimeout(
      'seed default settings in Firestore',
      ref.set(normalizeSettings()),
    );
  }

  async listExpenses(userId: string, filters?: ExpenseFilters) {
    await this.ensureUserDoc(userId);
    await this.ensureDefaultPaymentMethods(userId);
    const paymentMethods = await this.listPaymentMethods(userId);
    const snapshot = await this.withTimeout(
      'fetch expenses from Firestore',
      this.expensesRef(userId).get(),
    );
    return snapshot.docs
      .map((doc) =>
        normalizeLegacyExpense(
          this.mapDoc(doc.id, doc.data()) as Expense,
          paymentMethods,
        ),
      )
      .filter((expense) => matchesFilters(expense, filters))
      .sort((left, right) => right.date.localeCompare(left.date));
  }

  async createExpense(userId: string, input: ExpenseInput) {
    await this.ensureUserDoc(userId);
    const expense: Expense = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };

    await this.withTimeout(
      'create an expense in Firestore',
      this.expensesRef(userId).doc(expense.id).set(expense),
    );
    return expense;
  }

  async updateExpense(userId: string, expenseId: string, input: ExpenseInput) {
    const ref = this.expensesRef(userId).doc(expenseId);
    const existing = await this.withTimeout('load an expense from Firestore', ref.get());

    if (!existing.exists) {
      throw new Error('Expense not found');
    }

    const updated = {
      ...(existing.data() as Expense),
      ...input,
      id: expenseId,
    };

    await this.withTimeout('update an expense in Firestore', ref.set(updated));
    return updated;
  }

  async deleteExpense(userId: string, expenseId: string) {
    await this.withTimeout(
      'delete an expense from Firestore',
      this.expensesRef(userId).doc(expenseId).delete(),
    );
  }

  async listCategories(userId: string) {
    await this.ensureDefaultCategories(userId);
    const snapshot = await this.withTimeout(
      'fetch categories from Firestore',
      this.categoriesRef(userId).get(),
    );
    return snapshot.docs
      .map((doc) => this.mapDoc(doc.id, doc.data()) as Category)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async createCategory(userId: string, input: CategoryInput) {
    await this.ensureUserDoc(userId);
    const category: Category = {
      id: randomUUID(),
      ...input,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    await this.withTimeout(
      'create a category in Firestore',
      this.categoriesRef(userId).doc(category.id).set(category),
    );
    return category;
  }

  async updateCategory(userId: string, categoryId: string, input: CategoryInput) {
    const ref = this.categoriesRef(userId).doc(categoryId);
    const existing = await this.withTimeout('load a category from Firestore', ref.get());

    if (!existing.exists) {
      throw new Error('Category not found');
    }

    const updated = {
      ...(existing.data() as Category),
      ...input,
      id: categoryId,
    };

    await this.withTimeout('update a category in Firestore', ref.set(updated));
    return updated;
  }

  async deleteCategory(userId: string, categoryId: string) {
    await this.withTimeout(
      'delete a category from Firestore',
      this.categoriesRef(userId).doc(categoryId).delete(),
    );
  }

  async listBudgets(userId: string, month?: string) {
    await this.ensureUserDoc(userId);
    const snapshot = await this.withTimeout(
      'fetch budgets from Firestore',
      this.budgetsRef(userId).get(),
    );
    return snapshot.docs
      .map((doc) => this.mapDoc(doc.id, doc.data()) as Budget)
      .filter((budget) => (month ? budget.month === month : true));
  }

  async upsertBudget(userId: string, input: BudgetInput) {
    await this.ensureUserDoc(userId);
    const snapshot = await this.withTimeout(
      'look up an existing budget in Firestore',
      this.budgetsRef(userId)
        .where('category', '==', input.category)
        .where('month', '==', input.month)
        .limit(1)
        .get(),
    );

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const updated = {
        ...(doc.data() as Budget),
        limit: input.limit,
      };
      await this.withTimeout('update a budget in Firestore', doc.ref.set(updated));
      return this.mapDoc(doc.id, updated) as Budget;
    }

    const budget: Budget = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };

    await this.withTimeout(
      'create a budget in Firestore',
      this.budgetsRef(userId).doc(budget.id).set(budget),
    );
    return budget;
  }

  async listPaymentMethods(userId: string) {
    await this.ensureDefaultPaymentMethods(userId);
    const snapshot = await this.withTimeout(
      'fetch payment methods from Firestore',
      this.paymentMethodsRef(userId).get(),
    );
    return snapshot.docs
      .map((doc) => this.mapDoc(doc.id, doc.data()) as PaymentMethod)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async createPaymentMethod(userId: string, input: PaymentMethodInput) {
    await this.ensureUserDoc(userId);
    const paymentMethod: PaymentMethod = {
      id: randomUUID(),
      ...input,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    await this.withTimeout(
      'create a payment method in Firestore',
      this.paymentMethodsRef(userId).doc(paymentMethod.id).set(paymentMethod),
    );
    return paymentMethod;
  }

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    input: PaymentMethodInput,
  ) {
    const ref = this.paymentMethodsRef(userId).doc(paymentMethodId);
    const existing = await this.withTimeout(
      'load a payment method from Firestore',
      ref.get(),
    );

    if (!existing.exists) {
      throw new Error('Payment method not found');
    }

    const updated = {
      ...(existing.data() as PaymentMethod),
      ...input,
      id: paymentMethodId,
    };

    await this.withTimeout('update a payment method in Firestore', ref.set(updated));

    const expenseSnapshot = await this.withTimeout(
      'load expenses linked to a payment method in Firestore',
      this.expensesRef(userId).where('paymentMethodId', '==', paymentMethodId).get(),
    );

    if (!expenseSnapshot.empty) {
      const batch = this.db.batch();
      expenseSnapshot.docs.forEach((doc) => {
        batch.set(
          doc.ref,
          {
            ...(doc.data() as Expense),
            paymentMethodName: updated.name,
            source: updated.type,
          },
        );
      });
      await this.withTimeout(
        'refresh expense payment method labels in Firestore',
        batch.commit(),
      );
    }

    return updated;
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    const expenseSnapshot = await this.withTimeout(
      'check whether a payment method is linked to expenses in Firestore',
      this.expensesRef(userId).where('paymentMethodId', '==', paymentMethodId).limit(1).get(),
    );

    if (!expenseSnapshot.empty) {
      throw new Error(
        'This payment method is used by one or more transactions and cannot be deleted yet.',
      );
    }

    await this.withTimeout(
      'delete a payment method from Firestore',
      this.paymentMethodsRef(userId).doc(paymentMethodId).delete(),
    );
  }

  async getSettings(userId: string) {
    await this.ensureDefaultSettings(userId);
    const snapshot = await this.withTimeout(
      'fetch user settings from Firestore',
      this.settingsRef(userId).get(),
    );

    return normalizeSettings(snapshot.data() as Partial<UserSettings> | undefined);
  }

  async updateSettings(userId: string, input: UserSettingsInput) {
    await this.ensureUserDoc(userId);
    const updated = normalizeSettings({
      ...input,
      updatedAt: new Date().toISOString(),
    });

    await this.withTimeout(
      'update user settings in Firestore',
      this.settingsRef(userId).set(updated, { merge: true }),
    );

    return updated;
  }
}

export function createDataStore(provider: 'memory' | 'firestore') {
  if (provider === 'firestore') {
    return new FirestoreStore(getFirestoreClient());
  }

  return new MemoryStore();
}

export function getCurrentMonthRange() {
  return {
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  };
}
