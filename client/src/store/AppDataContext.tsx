import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import toast from 'react-hot-toast';
import { formatISO, startOfMonth } from 'date-fns';
import {
  createAuthProfile,
  initializeFirebaseAuth,
  isFirebaseRedirectPending,
  signInAsGuest,
  signInWithGoogle,
  signOutFirebaseUser,
  subscribeToAuthChanges,
} from '@/lib/firebase-auth';
import {
  createCategory,
  getCategories,
  removeCategory,
  updateCategory,
} from '@/services/categories';
import {
  createPaymentMethod,
  getPaymentMethods,
  removePaymentMethod,
  updatePaymentMethod,
} from '@/services/payment-methods';
import { getSettings, updateSettings } from '@/services/settings';
import { upsertBudget, getBudgets } from '@/services/budgets';
import { sendChatMessage } from '@/services/chat';
import {
  createExpense,
  getExpenses,
  removeExpense,
  updateExpense,
} from '@/services/expenses';
import {
  checkApiHealth,
  getApiErrorMessage,
  isServerWakeUpCandidate,
  waitForApiReady,
} from '@/services/api';
import {
  applyThemePreference,
  cacheSettings,
  defaultUserSettings,
  getCachedSettings,
} from '@/lib/preferences';
import { generateId } from '@/lib/utils';
import type {
  AuthProfile,
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  ChatMessage,
  ChatResponsePayload,
  Expense,
  ExpenseInput,
  PaymentMethod,
  PaymentMethodInput,
  UserSettings,
  UserSettingsInput,
} from '@/types/domain';

interface AppDataContextValue {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  paymentMethods: PaymentMethod[];
  settings: UserSettings;
  chatMessages: ChatMessage[];
  isBootstrapping: boolean;
  bootstrapStage: BootstrapStage;
  bootstrapError: string | null;
  hasCompletedInitialSync: boolean;
  serverStatus: ServerStatus;
  serverStatusMessage: string | null;
  canPerformServerActions: boolean;
  isWakingServer: boolean;
  authUserId: string | null;
  authProfile: AuthProfile | null;
  isAuthenticated: boolean;
  isExpenseModalOpen: boolean;
  editingExpense: Expense | null;
  refreshAll: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
  wakeServer: () => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  openCreateExpense: () => Promise<void>;
  openEditExpense: (expense: Expense) => Promise<void>;
  closeExpenseModal: () => void;
  saveExpense: (payload: ExpenseInput, expenseId?: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  saveCategory: (payload: CategoryInput, categoryId?: string) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<void>;
  savePaymentMethod: (
    payload: PaymentMethodInput,
    paymentMethodId?: string,
  ) => Promise<boolean>;
  deletePaymentMethod: (paymentMethodId: string) => Promise<void>;
  saveSettings: (payload: UserSettingsInput) => Promise<boolean>;
  saveBudget: (payload: BudgetInput) => Promise<void>;
  submitChatMessage: (message: string) => Promise<ChatResponsePayload | null>;
}

type BootstrapStage = 'loading' | 'waking-server';
export type ServerStatus = 'checking' | 'ready' | 'waking-server' | 'unavailable';

const AppDataContext = createContext<AppDataContextValue | null>(null);

const unavailableServerMessage =
  'Server is unavailable right now. Wake it up before making changes.';
const activeServerStatusPollIntervalMs = 5000;

function ensureList<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function confirmDestructiveAction(message: string) {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.confirm(message);
}

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function normalizePaymentMethodName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function buildWelcomeMessage(): ChatMessage {
  return {
    id: generateId('assistant'),
    role: 'assistant',
    content:
      "Welcome back. I can summarize your spending, flag budget risk, review card billing cycles, or add an expense from a natural-language message like 'I spent 450 on Zomato using HDFC Credit Card.'",
    timestamp: new Date().toISOString(),
  };
}

function createSettingsState(
  settings: Partial<UserSettingsInput> = {},
): UserSettings {
  return {
    currency: settings.currency || defaultUserSettings.currency,
    theme: settings.theme || defaultUserSettings.theme,
    updatedAt: new Date().toISOString(),
  };
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const cachedSettings = getCachedSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() =>
    createSettingsState(cachedSettings),
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    buildWelcomeMessage(),
  ]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapStage, setBootstrapStage] =
    useState<BootstrapStage>('loading');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [hasCompletedInitialSync, setHasCompletedInitialSync] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
  const [serverStatusMessage, setServerStatusMessage] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const pendingBootstrapUserIdRef = useRef<string | null>(null);
  const wakeServerPromiseRef = useRef<Promise<boolean> | null>(null);

  function markServerReady() {
    setServerStatus('ready');
    setServerStatusMessage(null);
  }

  function markServerUnavailable(message = unavailableServerMessage) {
    setServerStatus('unavailable');
    setServerStatusMessage(message);
  }

  async function refreshAll() {
    const currentMonth = formatISO(startOfMonth(new Date()), {
      representation: 'date',
    }).slice(0, 7);

    const [expenseData, categoryData, budgetData, paymentMethodData, settingsData] =
      await Promise.all([
        getExpenses(),
        getCategories(),
        getBudgets(currentMonth),
        getPaymentMethods(),
        getSettings(),
      ]);

    startTransition(() => {
      setExpenses(ensureList<Expense>(expenseData));
      setCategories(ensureList<Category>(categoryData));
      setBudgets(ensureList<Budget>(budgetData));
      setPaymentMethods(ensureList<PaymentMethod>(paymentMethodData));
      setSettings(settingsData);
      setBootstrapError(null);
    });

    markServerReady();
  }

  async function probeServerStatus({
    notifyOnFailure = false,
    setChecking = true,
    failureMessage = unavailableServerMessage,
    timeoutMs = 3000,
  }: {
    notifyOnFailure?: boolean;
    setChecking?: boolean;
    failureMessage?: string;
    timeoutMs?: number;
  } = {}) {
    if (!authUserId || !hasCompletedInitialSync) {
      return false;
    }

    if (setChecking && serverStatus !== 'waking-server') {
      setServerStatus('checking');
    }

    try {
      await checkApiHealth(timeoutMs);
      markServerReady();
      return true;
    } catch (error) {
      const message = isServerWakeUpCandidate(error)
        ? failureMessage
        : getApiErrorMessage(error);

      markServerUnavailable(message);

      if (notifyOnFailure) {
        toast.error(failureMessage);
      }

      return false;
    }
  }

  async function wakeServer() {
    if (wakeServerPromiseRef.current) {
      return wakeServerPromiseRef.current;
    }

    const wakePromise = (async () => {
      setServerStatusMessage(null);
      setServerStatus('checking');

      try {
        await waitForApiReady({
          onWakingServerChange: (isWaking) => {
            setServerStatus(isWaking ? 'waking-server' : 'checking');
          },
        });
        markServerReady();
        toast.success('Server is online. You can continue.');
        return true;
      } catch (error) {
        markServerUnavailable(
          isServerWakeUpCandidate(error)
            ? unavailableServerMessage
            : getApiErrorMessage(error),
        );
        toast.error('Server is still unavailable. Please try again.');
        return false;
      } finally {
        wakeServerPromiseRef.current = null;
      }
    })();

    wakeServerPromiseRef.current = wakePromise;
    return wakePromise;
  }

  async function requireReadyServerAction() {
    if (serverStatus === 'ready') {
      return true;
    }

    toast.error('Wake the server first, then try that action again.');
    return false;
  }

  function handleServerActionError(error: unknown) {
    if (isServerWakeUpCandidate(error)) {
      markServerUnavailable(unavailableServerMessage);
    }
  }

  async function syncAuthenticatedAppData(userId: string) {
    pendingBootstrapUserIdRef.current = userId;
    setBootstrapStage('loading');
    setBootstrapError(null);
    setServerStatusMessage(null);
    setServerStatus('checking');

    try {
      await waitForApiReady({
        onWakingServerChange: (isWaking) => {
          setBootstrapStage(isWaking ? 'waking-server' : 'loading');
          setServerStatus(isWaking ? 'waking-server' : 'checking');
        },
      });
      await refreshAll();
      lastSyncedUserIdRef.current = userId;
      setHasCompletedInitialSync(true);
      markServerReady();
    } finally {
      if (pendingBootstrapUserIdRef.current === userId) {
        pendingBootstrapUserIdRef.current = null;
      }

      setBootstrapStage('loading');
    }
  }

  useEffect(() => {
    applyThemePreference(settings.theme);
    cacheSettings({
      currency: settings.currency,
      theme: settings.theme,
    });

    if (typeof window === 'undefined' || settings.theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => applyThemePreference('system');

    mediaQuery.addEventListener('change', syncTheme);
    return () => mediaQuery.removeEventListener('change', syncTheme);
  }, [settings.currency, settings.theme]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const user = await initializeFirebaseAuth();

        if (!isMounted) {
          return;
        }

        setAuthUserId(user?.uid ?? null);
        setAuthProfile(createAuthProfile(user));

        if (user && lastSyncedUserIdRef.current !== user.uid) {
          await syncAuthenticatedAppData(user.uid);
        }
      } catch (error) {
        console.error('Wallet Wise bootstrap failed', error);
        handleServerActionError(error);
        if (isMounted) {
          setBootstrapError(
            error instanceof Error
              ? error.message
              : 'Unknown bootstrap error',
          );
          toast.error('Unable to initialize Firebase or load app data.');
        }
      } finally {
        if (isMounted && !isFirebaseRedirectPending()) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAuthUserId(user?.uid ?? null);
      setAuthProfile(createAuthProfile(user));

      if (!user) {
        pendingBootstrapUserIdRef.current = null;
        lastSyncedUserIdRef.current = null;
        setHasCompletedInitialSync(false);
        setBootstrapStage('loading');
        setServerStatus('checking');
        setServerStatusMessage(null);

        if (!isFirebaseRedirectPending()) {
          setIsBootstrapping(false);
        }

        return;
      }

      if (pendingBootstrapUserIdRef.current === user.uid) {
        return;
      }

      if (lastSyncedUserIdRef.current === user.uid) {
        setIsBootstrapping(false);
        return;
      }

      setIsBootstrapping(true);
      setHasCompletedInitialSync(false);

      void syncAuthenticatedAppData(user.uid).catch((error) => {
        console.error('Wallet Wise auth refresh failed', error);
        handleServerActionError(error);
        setBootstrapError(
          error instanceof Error ? error.message : 'Unable to refresh app data',
        );
      }).finally(() => {
        setIsBootstrapping(false);
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authUserId || !hasCompletedInitialSync) {
      return;
    }

    const handleResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      void probeServerStatus({ setChecking: false });
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || serverStatus === 'waking-server') {
        return;
      }

      void probeServerStatus({ setChecking: false });
    }, activeServerStatusPollIntervalMs);

    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      window.clearInterval(intervalId);
    };
  }, [authUserId, hasCompletedInitialSync, serverStatus]);

  async function openCreateExpense() {
    if (serverStatus === 'ready') {
      setEditingExpense(null);
      setIsExpenseModalOpen(true);
      return;
    }

    const isReady = await probeServerStatus({
      notifyOnFailure: true,
      failureMessage: 'Server is offline. Wake it up before adding a transaction.',
    });

    if (!isReady) {
      return;
    }

    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  }

  async function openEditExpense(expense: Expense) {
    if (serverStatus === 'ready') {
      setEditingExpense(expense);
      setIsExpenseModalOpen(true);
      return;
    }

    const isReady = await probeServerStatus({
      notifyOnFailure: true,
      failureMessage: 'Server is offline. Wake it up before editing a transaction.',
    });

    if (!isReady) {
      return;
    }

    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  }

  function closeExpenseModal() {
    setEditingExpense(null);
    setIsExpenseModalOpen(false);
  }

  async function saveExpense(payload: ExpenseInput, expenseId?: string) {
    if (!(await requireReadyServerAction())) {
      return;
    }

    try {
      const saved = expenseId
        ? await updateExpense(expenseId, payload)
        : await createExpense(payload);

      startTransition(() => {
        setExpenses((current) => {
          const currentExpenses = ensureList<Expense>(current);

          if (expenseId) {
            return currentExpenses.map((expense) =>
              expense.id === expenseId ? saved : expense,
            );
          }

          return [saved, ...currentExpenses].sort((left, right) =>
            right.date.localeCompare(left.date),
          );
        });
      });

      closeExpenseModal();
      markServerReady();
      toast.success(expenseId ? 'Transaction updated.' : 'Transaction added.');
    } catch (error) {
      handleServerActionError(error);
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }

  async function deleteExpense(expenseId: string) {
    const expense = expenses.find((item) => item.id === expenseId);

    if (
      !confirmDestructiveAction(
        expense
          ? `Delete "${expense.note || expense.merchant || expense.category}"?`
          : 'Delete this transaction?',
      )
    ) {
      return;
    }

    if (!(await requireReadyServerAction())) {
      return;
    }

    try {
      await removeExpense(expenseId);

      startTransition(() => {
        setExpenses((current) =>
          ensureList<Expense>(current).filter((expense) => expense.id !== expenseId),
        );
      });

      markServerReady();
      toast.success('Transaction removed.');
    } catch (error) {
      handleServerActionError(error);
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

    if (!(await requireReadyServerAction())) {
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

      markServerReady();
      toast.success(categoryId ? 'Category updated.' : 'Category added.');
      return true;
    } catch (error) {
      handleServerActionError(error);
      toast.error(getApiErrorMessage(error));
      return false;
    }
  }

  async function deleteCategory(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId);
    const isReferenced = category
      ? expenses.some((expense) => expense.category === category.name)
      : false;

    if (isReferenced) {
      toast.error(
        'This category has transactions. Remove or reassign those transactions first.',
      );
      return;
    }

    if (
      !confirmDestructiveAction(
        category
          ? `Delete the "${category.name}" category?`
          : 'Delete this category?',
      )
    ) {
      return;
    }

    if (!(await requireReadyServerAction())) {
      return;
    }

    try {
      await removeCategory(categoryId);

      startTransition(() => {
        setCategories((current) =>
          current.filter((category) => category.id !== categoryId),
        );
      });

      markServerReady();
      toast.success('Category removed.');
    } catch (error) {
      handleServerActionError(error);
      toast.error(getApiErrorMessage(error));
    }
  }

  async function savePaymentMethod(
    payload: PaymentMethodInput,
    paymentMethodId?: string,
  ) {
    const sanitizedPayload = {
      ...payload,
      name: payload.name.trim().replace(/\s+/g, ' '),
    };
    const duplicate = paymentMethods.find(
      (paymentMethod) =>
        normalizePaymentMethodName(paymentMethod.name) ===
          normalizePaymentMethodName(sanitizedPayload.name) &&
        paymentMethod.id !== paymentMethodId,
    );

    if (duplicate) {
      toast.error('A payment method with that name already exists.');
      return false;
    }

    if (!(await requireReadyServerAction())) {
      return false;
    }

    try {
      const saved = paymentMethodId
        ? await updatePaymentMethod(paymentMethodId, sanitizedPayload)
        : await createPaymentMethod(sanitizedPayload);
      const refreshedPaymentMethods = await getPaymentMethods();

      startTransition(() => {
        setPaymentMethods(ensureList<PaymentMethod>(refreshedPaymentMethods));
        setExpenses((current) =>
          ensureList<Expense>(current).map((expense) =>
            expense.paymentMethodId === saved.id
              ? {
                  ...expense,
                  paymentMethodName: saved.name,
                  source: saved.type,
                }
              : expense,
          ),
        );
      });

      markServerReady();
      toast.success(paymentMethodId ? 'Payment method updated.' : 'Payment method added.');
      return true;
    } catch (error) {
      handleServerActionError(error);
      toast.error(getApiErrorMessage(error));
      return false;
    }
  }

  async function deletePaymentMethod(paymentMethodId: string) {
    const paymentMethod = paymentMethods.find(
      (item) => item.id === paymentMethodId,
    );
    const isReferenced = expenses.some(
      (expense) => expense.paymentMethodId === paymentMethodId,
    );

    if (isReferenced) {
      toast.error(
        'This payment method has transactions. Remove those transactions first.',
      );
      return;
    }

    if (
      !confirmDestructiveAction(
        paymentMethod
          ? `Delete the "${paymentMethod.name}" payment method?`
          : 'Delete this payment method?',
      )
    ) {
      return;
    }

    if (!(await requireReadyServerAction())) {
      return;
    }

    try {
      await removePaymentMethod(paymentMethodId);

      startTransition(() => {
        setPaymentMethods((current) =>
          current.filter((paymentMethod) => paymentMethod.id !== paymentMethodId),
        );
      });

      markServerReady();
      toast.success('Payment method removed.');
    } catch (error) {
      handleServerActionError(error);
      toast.error(getApiErrorMessage(error));
    }
  }

  async function saveSettings(payload: UserSettingsInput) {
    if (!(await requireReadyServerAction())) {
      return false;
    }

    try {
      const saved = await updateSettings(payload);

      startTransition(() => {
        setSettings(saved);
      });

      markServerReady();
      toast.success('Settings updated.');
      return true;
    } catch (error) {
      handleServerActionError(error);
      toast.error(getApiErrorMessage(error));
      return false;
    }
  }

  async function saveBudget(payload: BudgetInput) {
    if (!(await requireReadyServerAction())) {
      return;
    }

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

      markServerReady();
      toast.success('Budget saved.');
    } catch (error) {
      handleServerActionError(error);
      toast.error(getApiErrorMessage(error));
    }
  }

  async function submitChatMessage(message: string) {
    if (!(await requireReadyServerAction())) {
      return null;
    }

    const userMessage: ChatMessage = {
      id: generateId('user'),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      status: 'complete',
    };

    setChatMessages((current) => [...current, userMessage]);

    try {
      const response = await sendChatMessage(message);

      const assistantMessage: ChatMessage = {
        id: generateId('assistant'),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        status: 'complete',
        payload: response,
      };

      startTransition(() => {
        setChatMessages((current) => [...current, assistantMessage]);

        if (response.expense) {
          setExpenses((current) => [
            response.expense!,
            ...ensureList<Expense>(current),
          ]);
        }
      });

      markServerReady();
      return response;
    } catch (error) {
      handleServerActionError(error);
      const assistantMessage: ChatMessage = {
        id: generateId('assistant'),
        role: 'assistant',
        content: 'I could not process that request. Please try again.',
        timestamp: new Date().toISOString(),
        status: 'error',
      };

      setChatMessages((current) => [...current, assistantMessage]);
      toast.error(getApiErrorMessage(error));
      return null;
    }
  }

  async function handleGoogleSignIn() {
    setBootstrapError(null);
    setBootstrapStage('loading');
    setHasCompletedInitialSync(false);
    setIsBootstrapping(true);

    try {
      const user = await signInWithGoogle();

      if (!user) {
        return;
      }

      setAuthUserId(user.uid);
      setAuthProfile(createAuthProfile(user));
      await syncAuthenticatedAppData(user.uid);
      toast.success('Signed in with Google.');
    } catch (error) {
      console.error('Google sign-in failed', error);
      handleServerActionError(error);
      setBootstrapError(
        error instanceof Error ? error.message : 'Google sign-in failed',
      );
      toast.error('Google sign-in failed.');
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function handleGuestSignIn() {
    setBootstrapError(null);
    setBootstrapStage('loading');
    setHasCompletedInitialSync(false);
    setIsBootstrapping(true);

    try {
      const user = await signInAsGuest();
      setAuthUserId(user.uid);
      setAuthProfile(createAuthProfile(user));
      await syncAuthenticatedAppData(user.uid);
      toast.success('Continuing as guest.');
    } catch (error) {
      console.error('Guest sign-in failed', error);
      handleServerActionError(error);
      setBootstrapError(
        error instanceof Error ? error.message : 'Guest sign-in failed',
      );
      toast.error('Guest sign-in failed.');
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function retryBootstrap() {
    if (!authUserId) {
      return;
    }

    setBootstrapError(null);
    setBootstrapStage('loading');
    setHasCompletedInitialSync(false);
    setIsBootstrapping(true);

    try {
      await syncAuthenticatedAppData(authUserId);
    } catch (error) {
      console.error('Wallet Wise bootstrap retry failed', error);
      handleServerActionError(error);
      setBootstrapError(
        error instanceof Error ? error.message : 'Unable to refresh app data',
      );
      toast.error('The server is still warming up. Please try again.');
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function handleSignOut() {
    await signOutFirebaseUser();
    pendingBootstrapUserIdRef.current = null;
    lastSyncedUserIdRef.current = null;
    wakeServerPromiseRef.current = null;
    setAuthUserId(null);
    setAuthProfile(null);
    setHasCompletedInitialSync(false);
    setExpenses([]);
    setCategories([]);
    setBudgets([]);
    setPaymentMethods([]);
    setChatMessages([buildWelcomeMessage()]);
    setEditingExpense(null);
    setIsExpenseModalOpen(false);
    setBootstrapError(null);
    setBootstrapStage('loading');
    setServerStatus('checking');
    setServerStatusMessage(null);
  }

  return (
    <AppDataContext.Provider
      value={{
        expenses,
        categories,
        budgets,
        paymentMethods,
        settings,
        chatMessages,
        isBootstrapping,
        bootstrapStage,
        bootstrapError,
        hasCompletedInitialSync,
        serverStatus,
        serverStatusMessage,
        canPerformServerActions: serverStatus === 'ready',
        isWakingServer: serverStatus === 'waking-server',
        authUserId,
        authProfile,
        isAuthenticated: Boolean(authUserId),
        isExpenseModalOpen,
        editingExpense,
        refreshAll,
        retryBootstrap,
        wakeServer,
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
        savePaymentMethod,
        deletePaymentMethod,
        saveSettings,
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
