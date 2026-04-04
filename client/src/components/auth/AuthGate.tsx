import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

interface AuthGateProps {
  bootstrapError: string | null;
  onGoogleSignIn: () => Promise<void>;
  onContinueAsGuest: () => Promise<void>;
}

const valueProps = [
  {
    icon: 'auto_graph',
    title: 'Visual monthly view',
    description: 'Track budgets, categories, and card-wise spend from one clean dashboard.',
  },
  {
    icon: 'forum',
    title: 'Ask in plain language',
    description: 'Use the assistant to query totals or add an expense the way you naturally type.',
  },
  {
    icon: 'credit_card',
    title: 'Real payment names',
    description: 'Filter transactions by your actual cards, UPI handles, and cash wallets.',
  },
];

const previewTransactions = [
  {
    title: 'Coffee beans',
    amount: 'Rs 1,540',
    meta: 'Groceries  •  HDFC Credit Card',
  },
  {
    title: 'Airport metro',
    amount: 'Rs 760',
    meta: 'Travel  •  personal@upi',
  },
  {
    title: 'Movie night',
    amount: 'Rs 900',
    meta: 'Leisure  •  Cash Wallet',
  },
];

export function AuthGate({
  bootstrapError,
  onGoogleSignIn,
  onContinueAsGuest,
}: AuthGateProps) {
  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-4%] h-64 w-64 rounded-full bg-primary/12 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute right-[-10%] top-[14%] h-72 w-72 rounded-full bg-secondary/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute bottom-[-8%] left-[20%] h-72 w-72 rounded-full bg-primary-container/60 blur-3xl sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:gap-10">
          <section className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 rounded-full border border-outline-variant/30 bg-surface-container-lowest/70 px-4 py-3 shadow-ambient backdrop-blur-xl">
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
                  Smart expense command center
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-3xl animate-float-in">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                Budgeting, but lighter
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-on-surface sm:text-5xl lg:text-6xl">
                Track every spend, review every card, and ask your ledger questions.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg">
                Wallet Wise brings expenses, payment methods, budgets, and AI search
                into one calm workspace designed for daily use.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {valueProps.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/72 p-5 shadow-ambient backdrop-blur-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-primary">
                    <MaterialIcon name={item.icon} className="text-[24px]" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-on-surface">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/72 p-5 shadow-ambient backdrop-blur-xl sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    Preview
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-on-surface">
                    A cleaner daily money flow
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
                    Review transactions, monitor budgets, and jump into the AI assistant
                    without switching tools or remembering spreadsheet formulas.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 md:min-w-[280px]">
                  <div className="rounded-[1.5rem] bg-primary px-4 py-4 text-on-primary">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-primary/70">
                      This Month
                    </p>
                    <p className="mt-2 text-xl font-black">Rs 8.4k</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                      Budget Risk
                    </p>
                    <p className="mt-2 text-xl font-black text-on-surface">2</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-surface-container-low px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                      Methods
                    </p>
                    <p className="mt-2 text-xl font-black text-on-surface">4</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {previewTransactions.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-surface-container-low p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
                        <MaterialIcon name="receipt_long" className="text-[20px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-on-surface">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">
                          {item.meta}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-on-surface">
                      {item.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[2.4rem] border border-outline-variant/20 bg-surface-container-lowest/82 p-6 shadow-ambient backdrop-blur-2xl sm:p-7">
              <div className="absolute inset-x-6 top-0 h-24 rounded-b-[2rem] bg-[linear-gradient(180deg,rgba(168,122,84,0.16),transparent)]" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      Welcome
                    </p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-on-surface">
                      Sign in to your wallet
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                      Use Google for your primary setup, or continue as a guest to
                      explore the app locally first.
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-primary text-on-primary">
                    <MaterialIcon name="lock" filled className="text-[26px]" />
                  </div>
                </div>

                <div className="mt-6 rounded-[1.8rem] bg-surface-container-low p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-primary">
                      <MaterialIcon name="shield_lock" className="text-[21px]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        Private by default
                      </p>
                      <p className="text-xs leading-5 text-on-surface-variant">
                        Only payment nicknames are stored, never sensitive card details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full gap-3 py-4 text-base"
                    onClick={() => void onGoogleSignIn()}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-lowest text-[13px] font-bold text-[#4285F4]">
                      G
                    </span>
                    Continue with Google
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full gap-3 py-4 text-base"
                    onClick={() => void onContinueAsGuest()}
                  >
                    <MaterialIcon name="person" className="text-[20px]" />
                    Continue as Guest
                  </Button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                      Sync
                    </p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">
                      Firebase-backed account flow
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                      Explore
                    </p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">
                      Guest mode for local-first testing
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-xs leading-5 text-on-surface-variant">
                  For Google login to work, enable Google in Firebase Authentication
                  and add your local domain to Authorized domains.
                </p>

                {bootstrapError ? (
                  <pre className="mt-4 overflow-x-auto rounded-[1.5rem] bg-error/8 p-4 text-xs text-error">
                    {bootstrapError}
                  </pre>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
