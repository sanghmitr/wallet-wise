import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import toast from 'react-hot-toast';
import { formatISO, startOfMonth } from 'date-fns';
import {
  initializeFirebaseAuth,
  signInAsGuest,
  signInWithGoogle,
  signOutFirebaseUser,
} from '@/lib/firebase-auth';
import {
  createCategory,
  getCategories,
  removeCategory,
  updateCategory,
} from '@/services/categories';
import { upsertBudget, getBudgets } from '@/services/budgets';
import { sendChatMessage } from '@/services/chat';
import {
  createExpense,
  getExpenses,
  removeExpense,
  updateExpense,
} from '@/services/expenses';
import { getApiErrorMessage } from '@/services/api';
import { generateId } from '@/lib/utils';
import type {
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  ChatMessage,
  ChatResponsePayload,
  Expense,
  ExpenseInput,
} from '@/types/domain';

interface AppDataContextValue {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  chatMessages: ChatMessage[];
  isBootstrapping: boolean;
  bootstrapError: string | null;
  authUserId: string | null;
  isAuthenticated: boolean;
  isExpenseModalOpen: boolean;
  editingExpense: Expense | null;
  refreshAll: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  openCreateExpense: () => void;
  openEditExpense: (expense: Expense) => void;
  closeExpenseModal: () => void;
  saveExpense: (payload: ExpenseInput, expenseId?: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  saveCategory: (payload: CategoryInput, categoryId?: string) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<void>;
  saveBudget: (payload: BudgetInput) => Promise<void>;
  submitChatMessage: (message: string) => Promise<ChatResponsePayload | null>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function buildWelcomeMessage(): ChatMessage {
  return {
    id: generateId('assistant'),
    role: 'assistant',
    content:
      "Welcome back. I can summarize your spending, flag budget risk, or add an expense from a natural-language message like 'I spent 450 on Zomato using UPI.'",
    timestamp: new Date().toISOString(),
  };
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    buildWelcomeMessage(),
  ]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  async function refreshAll() {
    const currentMonth = formatISO(startOfMonth(new Date()), {
      representation: 'date',
    }).slice(0, 7);

    const [expenseData, categoryData, budgetData] = await Promise.all([
      getExpenses(),
      getCategories(),
      getBudgets(currentMonth),
    ]);

    startTransition(() => {
      setExpenses(expenseData);
      setCategories(categoryData);
      setBudgets(budgetData);
      setBootstrapError(null);
    });
  }

  useEffect(() => {
    void (async () => {
      try {
        const user = await initializeFirebaseAuth();
        setAuthUserId(user?.uid ?? null);

        if (user) {
          await refreshAll();
        }
      } catch (error) {
        console.error('Wallet Wise bootstrap failed', error);
        setBootstrapError(
          error instanceof Error
            ? error.message
            : 'Unknown bootstrap error',
        );
        toast.error('Unable to initialize Firebase or load app data.');
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  function openCreateExpense() {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  }

  function closeExpenseModal() {
    setEditingExpense(null);
    setIsExpenseModalOpen(false);
  }

  async function saveExpense(payload: ExpenseInput, expenseId?: string) {
    try {
      const saved = expenseId
        ? await updateExpense(expenseId, payload)
        : await createExpense(payload);

      startTransition(() => {
        setExpenses((current) => {
          if (expenseId) {
            return current.map((expense) =>
              expense.id === expenseId ? saved : expense,
            );
          }

          return [saved, ...current].sort((left, right) =>
            right.date.localeCompare(left.date),
          );
        });
      });

      closeExpenseModal();
      toast.success(expenseId ? 'Transaction updated.' : 'Transaction added.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function deleteExpense(expenseId: string) {
    try {
      await removeExpense(expenseId);

      startTransition(() => {
        setExpenses((current) =>
          current.filter((expense) => expense.id !== expenseId),
        );
      });

      toast.success('Transaction removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function saveCategory(payload: CategoryInput, categoryId?: string) {
    const sanitizedPayload = {
      ...payload,
      name: payload.name.trim().replace(/\s+/g, ' '),
    };
    const duplicate = categories.find(
      (category) =>
        normalizeCategoryName(category.name) ===
          normalizeCategoryName(sanitizedPayload.name) &&
        category.id !== categoryId,
    );

    if (duplicate) {
      toast.error('A category with that name already exists.');
      return false;
    }

    try {
      const saved = categoryId
        ? await updateCategory(categoryId, sanitizedPayload)
        : await createCategory(sanitizedPayload);

      startTransition(() => {
        setCategories((current) => {
          if (categoryId) {
            return current.map((category) =>
              category.id === categoryId ? saved : category,
            );
          }

          return [...current, saved].sort((left, right) =>
            left.name.localeCompare(right.name),
          );
        });
      });

      toast.success(categoryId ? 'Category updated.' : 'Category added.');
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      return false;
    }
  }

  async function deleteCategory(categoryId: string) {
    try {
      await removeCategory(categoryId);

      startTransition(() => {
        setCategories((current) =>
          current.filter((category) => category.id !== categoryId),
        );
      });

      toast.success('Category removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function saveBudget(payload: BudgetInput) {
    try {
      const saved = await upsertBudget(payload);

      startTransition(() => {
        setBudgets((current) => {
          const existingIndex = current.findIndex(
            (budget) =>
              budget.category === saved.category && budget.month === saved.month,
          );

          if (existingIndex === -1) {
            return [...current, saved].sort((left, right) =>
              left.category.localeCompare(right.category),
            );
          }

          return current.map((budget, index) =>
            index === existingIndex ? saved : budget,
          );
        });
      });

      toast.success('Budget saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function submitChatMessage(message: string) {
    const userMessage: ChatMessage = {
      id: generateId('user'),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((current) => [...current, userMessage]);

    try {
      const response = await sendChatMessage(message);

      const assistantMessage: ChatMessage = {
        id: generateId('assistant'),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      startTransition(() => {
        setChatMessages((current) => [...current, assistantMessage]);

        if (response.expense) {
          setExpenses((current) => [response.expense!, ...current]);
        }
      });

      return response;
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: generateId('assistant'),
        role: 'assistant',
        content: 'I could not process that request. Please try again.',
        timestamp: new Date().toISOString(),
      };

      setChatMessages((current) => [...current, assistantMessage]);
      toast.error(getApiErrorMessage(error));
      return null;
    }
  }

  async function handleGoogleSignIn() {
    setBootstrapError(null);

    try {
      const user = await signInWithGoogle();

      if (!user) {
        return;
      }

      setAuthUserId(user.uid);
      await refreshAll();
      toast.success('Signed in with Google.');
    } catch (error) {
      console.error('Google sign-in failed', error);
      setBootstrapError(
        error instanceof Error ? error.message : 'Google sign-in failed',
      );
      toast.error('Google sign-in failed.');
    }
  }

  async function handleGuestSignIn() {
    setBootstrapError(null);

    try {
      const user = await signInAsGuest();
      setAuthUserId(user.uid);
      await refreshAll();
      toast.success('Continuing as guest.');
    } catch (error) {
      console.error('Guest sign-in failed', error);
      setBootstrapError(
        error instanceof Error ? error.message : 'Guest sign-in failed',
      );
      toast.error('Guest sign-in failed.');
    }
  }

  async function handleSignOut() {
    await signOutFirebaseUser();
    setAuthUserId(null);
    setExpenses([]);
    setCategories([]);
    setBudgets([]);
    setChatMessages([buildWelcomeMessage()]);
    setEditingExpense(null);
    setIsExpenseModalOpen(false);
    setBootstrapError(null);
  }

  return (
    <AppDataContext.Provider
      value={{
        expenses,
        categories,
        budgets,
        chatMessages,
        isBootstrapping,
        bootstrapError,
        authUserId,
        isAuthenticated: Boolean(authUserId),
        isExpenseModalOpen,
        editingExpense,
        refreshAll,
        signInWithGoogle: handleGoogleSignIn,
        continueAsGuest: handleGuestSignIn,
        signOut: handleSignOut,
        openCreateExpense,
        openEditExpense,
        closeExpenseModal,
        saveExpense,
        deleteExpense,
        saveCategory,
        deleteCategory,
        saveBudget,
        submitChatMessage,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return context;
}
