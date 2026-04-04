import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { useAppData } from '@/store/AppDataContext';
import type { PaymentSource } from '@/types/domain';

const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount is required'),
  category: z.string().min(1, 'Category is required'),
  source: z.enum(['credit', 'debit', 'upi', 'cash']),
  date: z.string().min(1, 'Date is required'),
  note: z.string().max(120).optional(),
  merchant: z.string().max(80).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const sourceOptions: Array<{ value: PaymentSource; label: string }> = [
  { value: 'credit', label: 'Credit Card' },
  { value: 'debit', label: 'Debit Card' },
  { value: 'upi', label: 'UPI / Transfer' },
  { value: 'cash', label: 'Cash' },
];

export function AddExpenseModal() {
  const navigate = useNavigate();
  const {
    categories,
    editingExpense,
    isExpenseModalOpen,
    closeExpenseModal,
    saveExpense,
  } = useAppData();

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
      source: 'credit',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      merchant: '',
    },
  });

  useEffect(() => {
    if (editingExpense) {
      reset({
        amount: editingExpense.amount,
        category: editingExpense.category,
        source: editingExpense.source,
        date: editingExpense.date,
        note: editingExpense.note || '',
        merchant: editingExpense.merchant || '',
      });
      return;
    }

    reset({
      amount: undefined,
      category: categories[0]?.name ?? '',
      source: 'credit',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      merchant: '',
    });
  }, [categories, editingExpense, reset]);

  if (!isExpenseModalOpen) {
    return null;
  }

  const selectedCategory = watch('category');
  const visibleCategories = categories.slice(0, 7);

  function openCategoryManager() {
    closeExpenseModal();
    navigate('/categories');
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white/75 backdrop-blur-xl">
      <div className="mx-auto min-h-screen max-w-2xl bg-background pb-36">
        <header className="glass-panel sticky top-0 z-10 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={closeExpenseModal}
              className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low"
            >
              <MaterialIcon name="close" />
            </button>
            <h2 className="text-lg font-bold text-on-surface">
              {editingExpense ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
            <MaterialIcon name="account_balance_wallet" filled className="text-[20px]" />
          </div>
        </header>

        <form
          onSubmit={handleSubmit(async (values) => {
            await saveExpense(values, editingExpense?.id);
          })}
          className="px-6 pt-8"
        >
          <section className="mb-10 text-center">
            <p className="mb-2 text-sm font-medium tracking-[0.22em] text-on-surface-variant">
              AMOUNT
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-light text-on-surface">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full border-none bg-transparent text-center text-6xl font-extrabold tracking-[-0.04em] text-primary outline-none placeholder:text-surface-dim"
                {...register('amount')}
              />
            </div>
            {errors.amount ? (
              <p className="mt-2 text-sm text-error">{errors.amount.message}</p>
            ) : null}
          </section>

          <section className="mb-8">
            <div className="mb-4 flex items-end justify-between">
              <h3 className="text-sm font-semibold tracking-[0.22em] text-on-surface">
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
              <div className="grid grid-cols-4 gap-4">
                {visibleCategories.map((category) => (
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
                        'flex h-14 w-14 items-center justify-center rounded-2xl shadow-ambient transition',
                        selectedCategory === category.name
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-lowest text-primary',
                      )}
                    >
                      <MaterialIcon name={category.icon} className="text-[24px]" />
                    </div>
                    <span
                      className={cn(
                        'text-center text-[11px] leading-4',
                        selectedCategory === category.name
                          ? 'font-bold text-primary'
                          : 'font-medium text-on-surface-variant',
                      )}
                    >
                      {category.name}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={openCategoryManager}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-surface-container-high bg-transparent text-primary transition hover:bg-surface-container-low"
                  >
                    <MaterialIcon name="add_circle" className="text-[24px]" />
                  </div>
                  <span className="text-center text-[11px] font-semibold leading-4 text-on-surface-variant">
                    New
                  </span>
                </button>
              </div>
            )}
            {errors.category ? (
              <p className="mt-3 text-sm text-error">{errors.category.message}</p>
            ) : null}
          </section>

          <section className="grid gap-4">
            <label className="rounded-[2rem] bg-surface-container-low p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Payment Source
              </span>
              <select
                className="mt-3 w-full rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-4 text-sm font-medium text-on-surface outline-none"
                {...register('source')}
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-[2rem] bg-surface-container-low p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Transaction Date
              </span>
              <input
                type="date"
                className="mt-3 w-full rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-4 text-sm font-medium text-on-surface outline-none"
                {...register('date')}
              />
            </label>

            <label className="rounded-[2rem] bg-surface-container-low p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Merchant
              </span>
              <input
                type="text"
                placeholder="Where did you spend?"
                className="mt-3 w-full rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-4 text-sm font-medium text-on-surface outline-none placeholder:text-outline-variant"
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
                <h3 className="text-sm font-bold text-on-surface">Budget Impact</h3>
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

          <div className="glass-panel fixed bottom-0 left-0 w-full px-6 pb-6 pt-4">
            <div className="mx-auto max-w-2xl">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 py-5 text-base"
              >
                <MaterialIcon name="check_circle" filled />
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
