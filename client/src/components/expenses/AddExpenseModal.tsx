import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { getCurrencySymbol } from '@/lib/format';
import {
  getPaymentMethodTypeLabel,
  paymentMethodIcons,
} from '@/lib/payment-methods';
import { cn } from '@/lib/utils';
import { useAppData } from '@/store/AppDataContext';
import type { PaymentMethod } from '@/types/domain';

const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount is required'),
  category: z.string().min(1, 'Category is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  paymentMethodName: z.string().min(1, 'Payment method is required'),
  source: z.enum(['credit_card', 'debit_card', 'upi', 'cash']),
  date: z.string().min(1, 'Date is required'),
  note: z.string().max(120).optional(),
  merchant: z.string().max(80).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

function buildDefaultExpenseValues(
  categories: Array<{ name: string }>,
  paymentMethods: PaymentMethod[],
): Partial<ExpenseFormValues> {
  const defaultPaymentMethod =
    paymentMethods.find((paymentMethod) => paymentMethod.isDefault) ??
    paymentMethods[0];

  return {
    amount: undefined,
    category: categories[0]?.name ?? '',
    paymentMethodId: defaultPaymentMethod?.id ?? '',
    paymentMethodName: defaultPaymentMethod?.name ?? '',
    source: defaultPaymentMethod?.type ?? 'cash',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
    merchant: '',
  };
}

export function AddExpenseModal() {
  const navigate = useNavigate();
  const {
    categories,
    paymentMethods,
    settings,
    editingExpense,
    isExpenseModalOpen,
    canPerformServerActions,
    closeExpenseModal,
    saveExpense,
    wakeServer,
    isWakingServer,
  } = useAppData();
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      category: '',
      paymentMethodId: '',
      paymentMethodName: '',
      source: 'cash',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      merchant: '',
    },
  });
  const amountField = register('amount');

  useEffect(() => {
    if (!isExpenseModalOpen) {
      return;
    }

    if (editingExpense) {
      reset({
        amount: editingExpense.amount,
        category: editingExpense.category,
        paymentMethodId: editingExpense.paymentMethodId,
        paymentMethodName: editingExpense.paymentMethodName,
        source: editingExpense.source,
        date: editingExpense.date,
        note: editingExpense.note || '',
        merchant: editingExpense.merchant || '',
      });
      return;
    }

    reset(buildDefaultExpenseValues(categories, paymentMethods));
  }, [categories, editingExpense, isExpenseModalOpen, paymentMethods, reset]);

  useEffect(() => {
    if (!isExpenseModalOpen || editingExpense || typeof window === 'undefined') {
      return;
    }

    if (window.innerWidth >= 1024) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      amountInputRef.current?.focus();
    }, 180);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [editingExpense, isExpenseModalOpen]);

  if (!isExpenseModalOpen) {
    return null;
  }

  const selectedCategory = watch('category');
  const selectedPaymentMethodId = watch('paymentMethodId');
  const submitExpense = handleSubmit(async (values) => {
    await saveExpense(values, editingExpense?.id);

    if (!editingExpense) {
      reset(buildDefaultExpenseValues(categories, paymentMethods));
    }
  });

  function openCategoryManager() {
    closeExpenseModal();
    navigate('/categories');
  }

  function openProfileManager() {
    closeExpenseModal();
    navigate('/profile');
  }

  function selectPaymentMethod(paymentMethod: PaymentMethod) {
    setValue('paymentMethodId', paymentMethod.id, { shouldValidate: true });
    setValue('paymentMethodName', paymentMethod.name, { shouldValidate: true });
    setValue('source', paymentMethod.type, { shouldValidate: true });
  }

  return (
    <div className="modal-screen-overlay fixed inset-0 z-50 overflow-y-auto backdrop-blur-xl">
      <div className="mx-auto min-h-screen max-w-2xl bg-background">
        <header className="glass-panel sticky top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={closeExpenseModal}
              className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low"
            >
              <MaterialIcon name="close" />
            </button>
            <h2 className="text-lg font-extrabold tracking-tight text-on-surface">
              {editingExpense ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
            <MaterialIcon name="account_balance_wallet" filled className="text-[20px]" />
          </div>
        </header>

        <form
          onSubmit={submitExpense}
          className="px-4 pb-40 pt-6 sm:px-6 sm:pb-44 sm:pt-8"
        >
          {!canPerformServerActions ? (
            <div className="mb-6 rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low p-4">
              <p className="text-sm font-bold text-on-surface">
                Wake the server before saving a transaction.
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                This form stays open, but the save action is disabled until the backend responds.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4 gap-2"
                onClick={() => void wakeServer()}
                disabled={isWakingServer}
              >
                <MaterialIcon
                  name={isWakingServer ? 'autorenew' : 'power'}
                  className={isWakingServer ? 'animate-spin' : 'text-[18px]'}
                />
                {isWakingServer ? 'Waking server...' : 'Wake server'}
              </Button>
            </div>
          ) : null}

          <input type="hidden" {...register('paymentMethodId')} />
          <input type="hidden" {...register('paymentMethodName')} />
          <input type="hidden" {...register('source')} />

          <section className="mb-8 text-center sm:mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              AMOUNT
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-light text-on-surface sm:text-4xl">
                {getCurrencySymbol(settings.currency)}
              </span>
              <input
                autoFocus={!editingExpense}
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full border-none bg-transparent text-center text-5xl font-extrabold tracking-[-0.04em] text-primary outline-none placeholder:text-surface-dim sm:text-6xl"
                {...amountField}
                ref={(element) => {
                  amountField.ref(element);
                  amountInputRef.current = element;
                }}
              />
            </div>
            {errors.amount ? (
              <p className="mt-2 text-sm text-error">{errors.amount.message}</p>
            ) : null}
          </section>

          <section className="mb-8">
            <div className="mb-4 flex items-end justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                CATEGORY
              </h3>
              <button
                type="button"
                onClick={openCategoryManager}
                className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition hover:bg-surface-container-high"
              >
                Manage
              </button>
            </div>

            {!categories.length ? (
              <div className="rounded-[1.75rem] bg-surface-container-low p-5">
                <p className="text-sm leading-6 text-on-surface">
                  You do not have any categories yet. Create one first and then
                  come back to finish this transaction.
                </p>
                <Button
                  type="button"
                  className="mt-4 gap-2"
                  onClick={openCategoryManager}
                >
                  <MaterialIcon name="add" filled className="text-[18px]" />
                  Create Category
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setValue('category', category.name, { shouldValidate: true })
                    }
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-[1rem] shadow-ambient transition sm:h-14 sm:w-14 sm:rounded-2xl',
                        selectedCategory === category.name
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-lowest text-primary',
                      )}
                    >
                      <MaterialIcon name={category.icon} className="text-[20px] sm:text-[24px]" />
                    </div>
                    <span
                      className={cn(
                        'text-center text-[10px] leading-4 sm:text-[11px]',
                        selectedCategory === category.name
                          ? 'font-bold text-primary'
                          : 'font-medium text-on-surface-variant',
                      )}
                    >
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors.category ? (
              <p className="mt-3 text-sm text-error">{errors.category.message}</p>
            ) : null}
          </section>

          <section className="grid gap-4">
            <label className="rounded-[1.5rem] bg-surface-container-low p-4 sm:rounded-[2rem] sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Payment Method
                </span>
                <button
                  type="button"
                  onClick={openProfileManager}
                  className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition hover:bg-surface-container-high"
                >
                  Manage
                </button>
              </div>

              {!paymentMethods.length ? (
                <div className="mt-3 rounded-[1.25rem] bg-surface-container-lowest p-4">
                  <p className="text-sm leading-6 text-on-surface">
                    Add at least one card name, UPI handle, or cash wallet in
                    Profile before saving transactions.
                  </p>
                  <Button
                    type="button"
                    className="mt-4 gap-2"
                    onClick={openProfileManager}
                  >
                    <MaterialIcon name="person" className="text-[18px]" />
                    Open Profile
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {paymentMethods.map((paymentMethod) => {
                    const isSelected = selectedPaymentMethodId === paymentMethod.id;

                    return (
                      <button
                        key={paymentMethod.id}
                        type="button"
                        onClick={() => selectPaymentMethod(paymentMethod)}
                        className={`flex w-full items-center justify-between rounded-[1rem] px-4 py-3.5 text-left transition sm:rounded-[1.25rem] sm:py-4 ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-ambient'
                            : 'bg-surface-container-lowest text-on-surface'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-surface-container-lowest/70 text-primary sm:h-11 sm:w-11 sm:rounded-2xl">
                            <MaterialIcon
                              name={
                                paymentMethodIcons[paymentMethod.type] || 'account_balance_wallet'
                              }
                              className="text-[18px] sm:text-[20px]"
                            />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">
                              {paymentMethod.name}
                            </span>
                            <span
                              className={`block text-xs ${
                                isSelected ? 'text-white/80' : 'text-on-surface-variant'
                              }`}
                            >
                              {getPaymentMethodTypeLabel(paymentMethod.type)}
                            </span>
                          </span>
                        </span>
                        {isSelected ? (
                          <MaterialIcon name="check_circle" filled className="text-[20px]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.paymentMethodId ? (
                <p className="mt-3 text-sm text-error">
                  {errors.paymentMethodId.message}
                </p>
              ) : null}
            </label>

            <label className="rounded-[1.5rem] bg-surface-container-low p-4 sm:rounded-[2rem] sm:p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Transaction Date
              </span>
              <input
                type="date"
                className="mt-3 w-full rounded-[1rem] border-none bg-surface-container-lowest px-4 py-3.5 text-sm font-medium text-on-surface outline-none sm:rounded-[1.25rem] sm:py-4"
                {...register('date')}
              />
            </label>

            <label className="rounded-[1.5rem] bg-surface-container-low p-4 sm:rounded-[2rem] sm:p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Merchant
              </span>
              <input
                type="text"
                placeholder="Where did you spend?"
                className="mt-3 w-full rounded-[1rem] border-none bg-surface-container-lowest px-4 py-3.5 text-sm font-medium text-on-surface outline-none placeholder:text-outline-variant sm:rounded-[1.25rem] sm:py-4"
                {...register('merchant')}
              />
            </label>

            <label className="rounded-[2rem] bg-surface-container-low p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Note (Optional)
              </span>
              <textarea
                rows={2}
                placeholder="What was this for?"
                className="mt-3 w-full resize-none rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-4 text-sm font-medium text-on-surface outline-none placeholder:text-outline-variant"
                {...register('note')}
              />
            </label>
          </section>

          <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-surface-container-high px-6 py-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_rgba(255,255,255,0.45),_transparent_35%)]" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-on-surface">Budget Impact</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Transactions update budget usage instantly on the dashboard.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-[65%] rounded-full bg-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                  Live
                </span>
              </div>
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 z-20 rounded-t-[1.75rem] border-t border-outline-variant/12 bg-background/94 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur-xl sm:px-6 sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <div className="mx-auto max-w-2xl">
            <Button
              type="button"
              disabled={isSubmitting || !canPerformServerActions}
              className="w-full gap-2 py-4 text-base shadow-[0_20px_40px_rgba(89,60,38,0.18)] sm:py-5"
              onClick={() => void submitExpense()}
            >
              <MaterialIcon name="check_circle" filled />
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
