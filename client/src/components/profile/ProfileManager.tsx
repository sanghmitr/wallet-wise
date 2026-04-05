import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatBillingCycleDayLabel } from '@/lib/billing-cycles';
import { currencyOptions } from '@/lib/format';
import { getPaymentMethodMeta, paymentMethodOptions } from '@/lib/payment-methods';
import { useAppData } from '@/store/AppDataContext';
import type {
  PaymentMethod,
  PaymentSource,
  ThemePreference,
  UserSettingsInput,
} from '@/types/domain';

const initialForm = {
  name: '',
  type: 'cash' as PaymentSource,
  billingCycleDay: '' as number | '',
};

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  hint: string;
}> = [
  { value: 'light', label: 'Light', hint: 'Bright and airy' },
  { value: 'dark', label: 'Dark', hint: 'Low-glare night mode' },
  { value: 'system', label: 'System', hint: 'Follow device appearance' },
];

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!words.length) {
    return 'WW';
  }

  return words.map((word) => word[0]?.toUpperCase() ?? '').join('');
}

export function ProfileManager() {
  const navigate = useNavigate();
  const {
    authProfile,
    paymentMethods,
    expenses,
    settings,
    savePaymentMethod,
    deletePaymentMethod,
    saveSettings,
    canPerformServerActions,
  } = useAppData();
  const [draft, setDraft] = useState(initialForm);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<UserSettingsInput>({
    currency: settings.currency,
    theme: settings.theme,
  });
  const formCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSettingsDraft({
      currency: settings.currency,
      theme: settings.theme,
    });
  }, [settings.currency, settings.theme]);

  const profileName = authProfile?.displayName || (authProfile?.isAnonymous ? 'Guest User' : 'Wallet Wise User');
  const profileSubtitle = authProfile?.isAnonymous
    ? 'Signed in with Firebase guest mode'
    : authProfile?.email || 'Signed in with Firebase';
  const profileInitials = getInitials(profileName);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    const saved = await savePaymentMethod(
      {
        name: draft.name.trim(),
        type: draft.type,
        billingCycleDay:
          draft.type === 'credit_card' && draft.billingCycleDay
            ? Number(draft.billingCycleDay)
            : null,
      },
      editing?.id,
    );

    if (saved) {
      resetForm();
    }
  }

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSettings(settingsDraft);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <header className="mb-8">
          <div className="mb-6 rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/88 p-5 shadow-ambient backdrop-blur-xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {authProfile?.photoURL ? (
                  <img
                    src={authProfile.photoURL}
                    alt={profileName}
                    className="h-16 w-16 rounded-[1.5rem] object-cover shadow-ambient"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary text-lg font-black text-on-primary shadow-ambient">
                    {profileInitials}
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Account
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight text-on-surface">
                    {profileName}
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {profileSubtitle}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
                <div className="rounded-[1.4rem] bg-surface-container-low p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Account Type
                  </p>
                  <p className="mt-2 text-sm font-bold text-on-surface">
                    {authProfile?.isAnonymous ? 'Guest' : 'Google'}
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-surface-container-low p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Payment Methods
                  </p>
                  <p className="mt-2 text-sm font-bold text-on-surface">
                    {paymentMethods.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            Profile
          </p>
          <h1 className="mt-1 text-[1.7rem] font-extrabold tracking-tight text-on-surface sm:text-3xl">
            Payment Methods
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Add the names of the cards and UPI handles you actually use. The app
            stores only the nickname, never card numbers or sensitive banking data.
          </p>
          <div className="mt-8 h-[2px] w-full bg-surface-container-highest">
            <div className="h-full w-1/4 rounded-full bg-primary" />
          </div>
        </header>

        {!paymentMethods.length ? (
          <EmptyState
            title="No payment methods yet"
            description="Add your first card, UPI handle, or cash wallet to start tagging expenses with real payment names."
          />
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((paymentMethod) => {
              const usageCount = expenses.filter(
                (expense) => expense.paymentMethodId === paymentMethod.id,
              ).length;
              const canDelete = usageCount === 0;
              const meta = getPaymentMethodMeta(paymentMethod.type);

              return (
                <Card
                  key={paymentMethod.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/profile/payment-methods/${paymentMethod.id}`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/profile/payment-methods/${paymentMethod.id}`);
                    }
                  }}
                  className="group flex cursor-pointer items-center justify-between gap-4 bg-surface-container-lowest transition hover:-translate-y-0.5 hover:bg-surface-container"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
                      <MaterialIcon name={meta.icon} className="text-[24px]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">
                        {paymentMethod.name}
                      </h3>
                      <p className="text-sm font-medium text-on-surface-variant">
                        {meta.label} • {usageCount} transactions
                      </p>
                      {paymentMethod.type === 'credit_card' ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {paymentMethod.billingCycleDay
                            ? `Billing cycle closes every ${formatBillingCycleDayLabel(
                                paymentMethod.billingCycleDay,
                              )}`
                            : 'Billing cycle not set yet'}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="hidden items-center gap-1 text-sm font-semibold text-primary md:flex">
                      <span>View</span>
                      <MaterialIcon name="chevron_right" className="text-[18px]" />
                    </div>
                    <div className="flex gap-2 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditing(paymentMethod);
                          setDraft({
                            name: paymentMethod.name,
                            type: paymentMethod.type,
                            billingCycleDay: paymentMethod.billingCycleDay ?? '',
                          });
                          focusComposer();
                        }}
                        disabled={!canPerformServerActions}
                        className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
                      >
                        <MaterialIcon name="edit" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deletePaymentMethod(paymentMethod.id);
                        }}
                        disabled={!canDelete || !canPerformServerActions}
                        aria-disabled={!canDelete || !canPerformServerActions}
                        title={
                          canDelete
                            ? 'Delete payment method'
                            : 'This payment method has transactions and cannot be deleted'
                        }
                        className={`rounded-full p-2 transition ${
                          canDelete
                            ? 'text-on-surface-variant hover:bg-surface-container-low hover:text-error'
                            : 'cursor-not-allowed text-on-surface-variant/45'
                        }`}
                      >
                        <MaterialIcon name="delete" className="text-[18px]" />
                      </button>
                    </div>
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
                {editing ? 'Edit Method' : 'New Method'}
              </p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-on-surface">
                {editing ? editing.name : 'Add a payment method'}
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
              Payment method changes are disabled until the backend is online.
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
                placeholder="HDFC Credit Card"
              />
            </label>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Method Type
              </span>
              <div className="mt-3 rounded-[1.25rem] bg-surface-container-lowest p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
                    <MaterialIcon
                      name={
                        paymentMethodOptions.find(
                          (option) => option.value === draft.type,
                        )?.icon ?? 'wallet'
                      }
                      className="text-[20px]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <select
                      value={draft.type}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          type: event.target.value as PaymentSource,
                          billingCycleDay:
                            event.target.value === 'credit_card'
                              ? current.billingCycleDay
                              : '',
                        }))
                      }
                      disabled={!canPerformServerActions}
                      className="w-full border-none bg-transparent text-sm font-semibold text-on-surface outline-none"
                    >
                      {paymentMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {
                        paymentMethodOptions.find(
                          (option) => option.value === draft.type,
                        )?.hint
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {draft.type === 'credit_card' ? (
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                  Billing Cycle Day
                </span>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={draft.billingCycleDay}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      billingCycleDay: event.target.value
                        ? Number(event.target.value)
                        : '',
                    }))
                  }
                  disabled={!canPerformServerActions}
                  className="mt-3 w-full rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none"
                  placeholder="e.g. 15"
                />
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                  Enter the monthly statement closing day for this credit card.
                  Use a day from 1 to 28 so billing-cycle filters stay reliable.
                </p>
              </label>
            ) : null}

            <Button type="submit" className="w-full" disabled={!canPerformServerActions}>
              {editing ? 'Update Payment Method' : 'Save Payment Method'}
            </Button>
          </form>
        </Card>

        <Card className="bg-surface-container-low">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
              Settings
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-on-surface">
              Preferences
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Choose the currency used for totals and pick how the interface should
              follow light, dark, or system appearance.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSettingsSubmit}>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Currency
              </span>
              <select
                value={settingsDraft.currency}
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    currency: event.target.value as UserSettingsInput['currency'],
                  }))
                }
                disabled={!canPerformServerActions}
                className="mt-3 w-full rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none"
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.value})
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Theme
              </span>
              <div className="mt-3 space-y-3">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSettingsDraft((current) => ({
                        ...current,
                        theme: option.value,
                      }))
                    }
                    disabled={!canPerformServerActions}
                    className={`flex w-full items-center justify-between rounded-[1.25rem] px-4 py-4 text-left transition ${
                      settingsDraft.theme === option.value
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span
                        className={`mt-1 block text-xs ${
                          settingsDraft.theme === option.value
                            ? 'text-white/80'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {option.hint}
                      </span>
                    </span>
                    {settingsDraft.theme === option.value ? (
                      <MaterialIcon name="check_circle" filled className="text-[20px]" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!canPerformServerActions}>
              Save Preferences
            </Button>
          </form>
        </Card>

        <Card className="bg-primary text-on-primary">
          <div className="flex items-start gap-3">
            <MaterialIcon name="shield" filled className="text-[22px]" />
            <div>
              <h3 className="text-base font-bold">Privacy First</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Store only safe labels like “HDFC Credit Card” or “personal@upi”.
                No card numbers, CVV, or account-sensitive details are saved.
              </p>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
