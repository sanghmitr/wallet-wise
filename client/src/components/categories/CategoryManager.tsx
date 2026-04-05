import { useRef, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppData } from '@/store/AppDataContext';
import type { Category } from '@/types/domain';

const iconOptions = [
  'restaurant',
  'directions_car',
  'shopping_bag',
  'receipt_long',
  'inventory_2',
  'medical_services',
  'movie',
  'home_work',
];

const colorOptions = [
  '#5f5e5e',
  '#7a8799',
  '#7a778f',
  '#a79892',
  '#bf7b77',
  '#c98c5d',
  '#b46f8c',
  '#6f8fb5',
  '#4f9a8f',
  '#7ea35f',
  '#d07a6f',
  '#8f78c6',
];

const initialForm = {
  name: '',
  icon: 'restaurant',
  color: '#5f5e5e',
};

export function CategoryManager() {
  const {
    categories,
    expenses,
    saveCategory,
    deleteCategory,
    canPerformServerActions,
  } = useAppData();
  const [draft, setDraft] = useState(initialForm);
  const [editing, setEditing] = useState<Category | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);

  function focusComposer() {
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  function resetForm() {
    setDraft(initialForm);
    setEditing(null);
  }

  function startNewCategory() {
    resetForm();
    focusComposer();
  }

  function startEditingCategory(category: Category) {
    setEditing(category);
    setDraft({
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
    focusComposer();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    const saved = await saveCategory(
      {
        name: draft.name.trim(),
        icon: draft.icon,
        color: draft.color,
      },
      editing?.id,
    );

    if (saved) {
      resetForm();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <header className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Library
              </p>
              <h1 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-on-surface sm:text-3xl">
                Categories
              </h1>
            </div>

            <Button
              className="gap-2"
              onClick={startNewCategory}
              disabled={!canPerformServerActions}
            >
              <MaterialIcon name="add" filled className="text-[18px]" />
              New Category
            </Button>
          </div>
          <div className="mt-8 h-[2px] w-full bg-surface-container-highest">
            <div className="h-full w-1/4 rounded-full bg-primary" />
          </div>
        </header>

        {!categories.length ? (
          <EmptyState
            title="No categories yet"
            description="Create your first category to organize spending, budgets, and smarter AI summaries."
            actionLabel="Create Category"
            onAction={startNewCategory}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {categories.map((category) => {
              const transactionCount = expenses.filter(
                (expense) => expense.category === category.name,
              ).length;

              return (
                <Card
                  key={category.id}
                  className="group flex items-center justify-between bg-surface-container-lowest"
                >
                  <div className="flex items-center gap-5">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
                      <MaterialIcon name={category.icon} className="text-[24px]" />
                      <span
                        className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">
                        {category.name}
                      </h3>
                      <p className="text-sm font-medium text-on-surface-variant">
                        {transactionCount} transactions
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                    <button
                      onClick={() => startEditingCategory(category)}
                      disabled={!canPerformServerActions}
                      className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
                    >
                      <MaterialIcon name="edit" className="text-[18px]" />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      disabled={!canPerformServerActions}
                      className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low hover:text-error disabled:opacity-45"
                    >
                      <MaterialIcon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </Card>
              );
            })}

          </div>
        )}
      </section>

      <aside className="space-y-6">
        <Card ref={formCardRef} className="bg-surface-container-low">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                {editing ? 'Edit Category' : 'New Category'}
              </p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-on-surface">
                {editing ? editing.name : 'Define a new category'}
              </h2>
            </div>
            <Button
              variant="secondary"
              onClick={resetForm}
              disabled={!canPerformServerActions}
            >
              Clear
            </Button>
          </div>

          {!canPerformServerActions ? (
            <div className="mt-4 rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
              Category changes are disabled until the backend is online.
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Name
              </span>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                disabled={!canPerformServerActions}
                className="mt-3 w-full rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none"
                placeholder="Food"
              />
            </label>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Icon
              </span>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, icon }))}
                    disabled={!canPerformServerActions}
                    className={`flex h-12 w-full items-center justify-center rounded-2xl transition ${
                      draft.icon === icon
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-lowest text-primary'
                    }`}
                  >
                    <MaterialIcon name={icon} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Accent
              </span>
              <div className="mt-3 grid grid-cols-6 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, color }))}
                    disabled={!canPerformServerActions}
                    className="h-10 w-10 rounded-full border-4 border-white shadow-ambient"
                    style={{
                      backgroundColor: color,
                      outline:
                        draft.color === color ? '2px solid rgba(95, 94, 94, 0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!canPerformServerActions}>
              {editing ? 'Update Category' : 'Create Category'}
            </Button>
          </form>
        </Card>

        <Card className="bg-primary text-on-primary">
          <div className="flex items-start gap-3">
            <MaterialIcon name="auto_awesome" filled className="text-[22px]" />
            <div>
              <h3 className="text-base font-bold">Optimization Tip</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Merge overlapping categories where possible. Cleaner taxonomy
                improves dashboard accuracy and AI query results.
              </p>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
