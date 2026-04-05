import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

type BootScreenVariant = 'loading' | 'waking-server' | 'error';

interface BootScreenProps {
  variant?: BootScreenVariant;
  errorMessage?: string | null;
  onRetry?: () => void | Promise<void>;
}

const expenseFacts = [
  'Review fixed costs once a month. Small subscription leaks are easier to catch there than in daily spending.',
  'Payment-method labels help more than card numbers. Name them after how you think, like travel card or grocery UPI.',
  'A 30-day spending view is useful for habits, while a calendar-month view is better for budgets and salary planning.',
  'Separate needs, wants, and autopay bills once. Every later expense review becomes faster and less noisy.',
];

const progressLabels = [
  'Preparing your secure session',
  'Checking whether the API is awake',
  'Loading expenses, budgets, and payment methods',
];

function getCopy(variant: BootScreenVariant) {
  if (variant === 'waking-server') {
    return {
      eyebrow: 'Server warm-up in progress',
      title: 'Booting up the backend',
      description:
        'The API looks inactive after a long pause. Wallet Wise is pinging it now and will continue as soon as the service responds.',
      badgeIcon: 'cloud_sync',
    };
  }

  if (variant === 'error') {
    return {
      eyebrow: 'Still waiting on the backend',
      title: 'The server is taking longer than expected',
      description:
        'Your session is still safe. Try again in a moment and Wallet Wise will resume where it left off.',
      badgeIcon: 'wifi_tethering_error',
    };
  }

  return {
    eyebrow: 'Loading Wallet Wise',
    title: 'Checking your workspace',
    description:
      'We are preparing your session, syncing your latest data, and getting the dashboard ready.',
    badgeIcon: 'hourglass_top',
  };
}

export function BootScreen({
  variant = 'loading',
  errorMessage,
  onRetry,
}: BootScreenProps) {
  const [factIndex, setFactIndex] = useState(0);
  const copy = getCopy(variant);

  useEffect(() => {
    if (variant !== 'waking-server') {
      setFactIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % expenseFacts.length);
    }, 4200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [variant]);

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-6%] h-64 w-64 rounded-full bg-primary/14 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute right-[-10%] top-[12%] h-72 w-72 rounded-full bg-secondary/18 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute bottom-[-10%] left-[18%] h-72 w-72 rounded-full bg-primary-container/55 blur-3xl sm:h-[26rem] sm:w-[26rem]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:gap-10">
          <section className="order-1">
            <div className="inline-flex items-center gap-3 rounded-full border border-outline-variant/30 bg-surface-container-lowest/72 px-4 py-3 shadow-ambient backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary">
                <MaterialIcon
                  name="account_balance_wallet"
                  filled
                  className="text-[22px]"
                />
              </div>
              <div>
                <p className="text-base font-black tracking-tight text-on-surface">
                  Wallet Wise
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-on-surface-variant">
                  Expense command center
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-on-surface sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg">
                {copy.description}
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {progressLabels.map((label, index) => {
                const status =
                  variant === 'loading'
                    ? index === 0
                      ? 'active'
                      : 'pending'
                    : index === 0
                      ? 'complete'
                      : index === 1
                        ? 'active'
                        : 'pending';
                const isActive = status === 'active';
                const isComplete = status === 'complete';

                return (
                  <div
                    key={label}
                    className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/72 p-5 shadow-ambient backdrop-blur-xl"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isComplete
                          ? 'bg-primary text-on-primary'
                          : isActive
                            ? 'bg-primary-container text-primary'
                            : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      <MaterialIcon
                        name={isComplete ? 'check' : isActive ? 'autorenew' : 'schedule'}
                        className={`text-[24px] ${isActive ? 'animate-spin' : ''}`}
                      />
                    </div>
                    <p className="mt-4 text-lg font-bold text-on-surface">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      {index === 0 && 'Authentication and local preferences are being restored.'}
                      {index === 1 && 'This is the step that waits when the hosting service has gone idle.'}
                      {index === 2 && 'Your latest ledger data loads right after the backend comes back.'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/72 p-5 shadow-ambient backdrop-blur-xl sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
                  <MaterialIcon name="lightbulb" className="text-[24px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Expense habit to remember
                  </p>
                  <p className="mt-3 text-lg font-bold text-on-surface">
                    {expenseFacts[factIndex]}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="order-2 mt-2 lg:mt-0">
            <div className="relative overflow-hidden rounded-[2.4rem] border border-outline-variant/20 bg-surface-container-lowest/82 p-6 shadow-ambient backdrop-blur-2xl sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,122,84,0.16),transparent_32%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.44),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.14),transparent_34%)]" />
              <div className="absolute right-[-2.5rem] top-[-3rem] h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Status
                    </p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-on-surface">
                      {variant === 'error' ? 'Waiting on connection' : 'Preparing dashboard'}
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-primary text-on-primary">
                    <MaterialIcon
                      name={copy.badgeIcon}
                      filled={variant !== 'loading'}
                      className="text-[26px]"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[1.8rem] bg-surface-container-low p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-primary">
                      <MaterialIcon
                        name={variant === 'error' ? 'sync_problem' : 'dns'}
                        className={`text-[21px] ${variant === 'waking-server' ? 'animate-pulse' : ''}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {variant === 'waking-server'
                          ? 'The backend is starting up'
                          : variant === 'error'
                            ? 'Backend is still unreachable'
                            : 'Startup checks are running'}
                      </p>
                      <p className="text-xs leading-5 text-on-surface-variant">
                        {variant === 'waking-server'
                          ? 'Cold starts can take a little while after inactivity on the current hosting setup.'
                          : variant === 'error'
                            ? 'A retry sends a fresh health check without signing you out.'
                            : 'This only appears while Wallet Wise restores your session and fetches data.'}
                      </p>
                    </div>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="mt-5 rounded-[1.5rem] border border-error/25 bg-error/8 p-4 text-sm leading-6 text-on-surface">
                    {errorMessage}
                  </div>
                ) : null}

                {variant === 'error' && onRetry ? (
                  <Button className="mt-6 w-full" onClick={() => void onRetry()}>
                    Retry connection
                  </Button>
                ) : (
                  <div className="mt-6 rounded-[1.6rem] bg-surface-container-low p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`h-full rounded-full bg-primary ${
                            variant === 'waking-server'
                              ? 'w-[58%] animate-pulse'
                              : 'w-[34%]'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                        {variant === 'waking-server' ? 'Warming up' : 'Loading'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
