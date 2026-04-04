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
  Expense,
  ExpenseFilters,
  ExpenseInput,
} from '../types/domain.js';

interface UserData {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
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

function createDefaultCategories() {
  return defaultCategories.map((category) => ({
    ...category,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }));
}

function mergeMissingDefaultCategories(categories: Category[]) {
  const existingNames = new Set(
    categories.map((category) => category.name.trim().toLocaleLowerCase()),
  );
  const missing = defaultCategories
    .filter((category) => !existingNames.has(category.name.toLocaleLowerCase()))
    .map((category) => ({
      ...category,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }));

  return missing.length ? [...categories, ...missing] : categories;
}

function createDemoExpenses(): Expense[] {
  const today = new Date();
  const currentMonth = format(today, 'yyyy-MM');

  const expenses: Expense[] = [
    {
      id: randomUUID(),
      amount: 450,
      category: 'Food & Dining',
      source: 'upi',
      date: `${currentMonth}-02`,
      note: 'Zomato dinner',
      merchant: 'Zomato',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 1540,
      category: 'Groceries',
      source: 'credit',
      date: `${currentMonth}-06`,
      note: 'Blue Tokai coffee beans',
      merchant: 'Blue Tokai',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 420,
      category: 'Travel',
      source: 'upi',
      date: `${currentMonth}-08`,
      note: 'Uber trip',
      merchant: 'Uber',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 2850,
      category: 'Shopping',
      source: 'credit',
      date: `${currentMonth}-12`,
      note: 'Apartment essentials',
      merchant: 'IKEA',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 4999,
      category: 'Rent & Utilities',
      source: 'debit',
      date: `${currentMonth}-14`,
      note: 'Electricity bill',
      merchant: 'BESCOM',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 900,
      category: 'Leisure',
      source: 'cash',
      date: `${currentMonth}-15`,
      note: 'Movie night',
      merchant: 'PVR',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 680,
      category: 'Health',
      source: 'debit',
      date: `${currentMonth}-17`,
      note: 'Pharmacy order',
      merchant: 'Apollo Pharmacy',
      createdAt: today.toISOString(),
    },
    {
      id: randomUUID(),
      amount: 760,
      category: 'Travel',
      source: 'upi',
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

  if (filters.source && filters.source !== 'all' && expense.source !== filters.source) {
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

class MemoryStore implements DataStore {
  private users = new Map<string, UserData>();

  private getUserData(userId: string): UserData {
    const existing = this.users.get(userId);

    if (existing) {
      existing.categories = mergeMissingDefaultCategories(existing.categories);
      return existing;
    }

    const created: UserData = {
      categories: createDefaultCategories(),
      expenses: createDemoExpenses(),
      budgets: createDemoBudgets(),
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
}

class FirestoreStore implements DataStore {
  constructor(private readonly db: Firestore) {}

  private usersRef() {
    return this.db.collection('users');
  }

  private expensesRef(userId: string) {
    return this.db.collection('users').doc(userId).collection('expenses');
  }

  private categoriesRef(userId: string) {
    return this.db.collection('users').doc(userId).collection('categories');
  }

  private budgetsRef(userId: string) {
    return this.db.collection('users').doc(userId).collection('budgets');
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
      snapshot.docs.map((doc) => {
        const data = doc.data() as Partial<Category>;
        return data.name?.trim().toLocaleLowerCase() ?? '';
      }),
    );
    const missingDefaults = defaultCategories.filter(
      (category) => !existingNames.has(category.name.toLocaleLowerCase()),
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
      const ref = this.categoriesRef(userId).doc(created.id);
      batch.set(ref, created);
    });
    await this.withTimeout('seed default categories in Firestore', batch.commit());
  }

  async listExpenses(userId: string, filters?: ExpenseFilters) {
    await this.ensureUserDoc(userId);
    const snapshot = await this.withTimeout(
      'fetch expenses from Firestore',
      this.expensesRef(userId).get(),
    );
    const data = snapshot.docs
      .map((doc) => this.mapDoc(doc.id, doc.data()) as Expense)
      .filter((expense) => matchesFilters(expense, filters))
      .sort((left, right) => right.date.localeCompare(left.date));

    return data;
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
    const existing = await this.withTimeout(
      'load an expense from Firestore',
      ref.get(),
    );

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
    const existing = await this.withTimeout(
      'load a category from Firestore',
      ref.get(),
    );

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
