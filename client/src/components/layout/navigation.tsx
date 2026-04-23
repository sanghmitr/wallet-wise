import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';

export interface NavigationItem {
  label: string;
  to: string;
  icon: string;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: 'dashboard' },
  { label: 'Budgets', to: '/budgets', icon: 'query_stats' },
  { label: 'Categories', to: '/categories', icon: 'category' },
  { label: 'Profile', to: '/profile', icon: 'person' },
];

interface NavigationProps {
  onAddExpense: () => void | Promise<void>;
  onSignOut?: () => void;
  onWakeServer?: () => void;
  serverStatus?: 'checking' | 'ready' | 'waking-server' | 'unavailable';
  isAddDisabled?: boolean;
}

function ServerStatusPill({
  serverStatus = 'checking',
  tone = 'default',
}: Pick<NavigationProps, 'serverStatus'> & { tone?: 'default' | 'inverse' }) {
  const isReady = serverStatus === 'ready';
  const isWaking = serverStatus === 'waking-server';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]',
        tone === 'inverse'
          ? isReady
            ? 'bg-white/12 text-white'
            : 'bg-white/8 text-white/72'
          : isReady
            ? 'bg-primary-container text-on-primary-container'
            : 'bg-surface-container-low text-on-surface-variant',
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isReady ? 'bg-emerald-400' : 'bg-amber-400',
          isWaking ? 'animate-pulse' : '',
        )}
      />
      {isReady
        ? 'Online'
        : isWaking
          ? 'Waking'
          : serverStatus === 'checking'
            ? 'Checking'
            : 'Offline'}
    </div>
  );
}

export function DesktopSidebar({
  onAddExpense,
  onSignOut,
  onWakeServer,
  serverStatus,
  isAddDisabled,
}: NavigationProps) {
  return (
    <aside className="hidden lg:fixed lg:bottom-4 lg:left-4 lg:top-4 lg:flex lg:w-[17rem] lg:flex-col lg:overflow-hidden lg:rounded-[2rem] lg:border lg:border-outline-variant/70 lg:bg-surface-container-lowest/92 lg:p-6 lg:text-on-surface lg:backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,85,241,0.12),transparent_34%)]" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-on-surface text-background">
            <MaterialIcon
              name="account_balance_wallet"
              filled
              className="text-[22px]"
            />
          </div>
          <div>
            <p className="font-display text-lg font-medium tracking-[-0.02em]">
              Wallet Wise
            </p>
          </div>
        </div>

        <div className="mt-5">
          <ServerStatusPill serverStatus={serverStatus} />
        </div>
      </div>

      <nav className="relative mt-8 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium tracking-[0.01em] transition',
                isActive
                  ? 'bg-on-surface text-background'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              )
            }
          >
            <MaterialIcon name={item.icon} className="text-[19px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="relative mt-6 space-y-3">
        <Button
          className="w-full justify-center gap-2 border-white bg-white text-[#191c1f] hover:bg-white/92"
          onClick={onAddExpense}
          disabled={isAddDisabled}
        >
          <MaterialIcon name="add" filled className="text-[18px]" />
          Add Transaction
        </Button>

        {serverStatus !== 'ready' && onWakeServer ? (
          <Button
            variant="ghost"
            className="w-full justify-center gap-2 border-outline-variant text-on-surface hover:bg-surface-container-low"
            onClick={onWakeServer}
            disabled={serverStatus === 'waking-server'}
          >
            <MaterialIcon
              name={serverStatus === 'waking-server' ? 'autorenew' : 'power'}
              className={serverStatus === 'waking-server' ? 'animate-spin text-[18px]' : 'text-[18px]'}
            />
            {serverStatus === 'waking-server' ? 'Waking Server' : 'Wake Server'}
          </Button>
        ) : null}
      </div>

      <div className="relative mt-auto rounded-[1.6rem] border border-outline-variant/70 bg-surface-container-low p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          Assistant
        </p>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          Search spend patterns, ask questions in plain language, and add entries
          without leaving your workflow.
        </p>
        <Link
          to="/chat"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-on-surface px-4 py-3 font-display text-sm font-medium text-background transition hover:scale-[1.02]"
        >
          <MaterialIcon name="forum" className="text-[18px]" />
          Open Assistant
        </Link>
        {onSignOut ? (
          <button
            onClick={onSignOut}
            className="mt-3 inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm text-on-surface-variant transition hover:text-on-surface"
          >
            <MaterialIcon name="logout" className="text-[18px]" />
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function MobileTopBar({
  onSignOut,
  onWakeServer,
  serverStatus,
}: Pick<NavigationProps, 'onSignOut' | 'onWakeServer' | 'serverStatus'>) {
  return (
    <header className="glass-panel fixed left-3 right-3 top-3 z-40 flex items-center justify-between rounded-full px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface text-background">
          <MaterialIcon name="account_balance_wallet" filled className="text-[20px]" />
        </div>
        <div>
          <p className="font-display text-[0.98rem] font-medium tracking-[-0.02em] text-on-surface">
            Wallet Wise
          </p>
          <ServerStatusPill serverStatus={serverStatus} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        {serverStatus !== 'ready' && onWakeServer ? (
          <button
            onClick={onWakeServer}
            className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Wake server"
          >
            <MaterialIcon
              name={serverStatus === 'waking-server' ? 'autorenew' : 'power'}
              className={serverStatus === 'waking-server' ? 'animate-spin' : ''}
            />
          </button>
        ) : null}
        <Link
          to="/chat"
          className="group relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-primary/18 bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(168,122,84,0.08),0_0_18px_rgba(168,122,84,0.18)] transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_0_1px_rgba(168,122,84,0.14),0_0_24px_rgba(168,122,84,0.28)]"
          aria-label="Open AI assistant"
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(168,122,84,0.26)_0%,rgba(168,122,84,0.1)_48%,transparent_76%)] opacity-95 animate-heartbeat" />
          <span className="absolute inset-[7px] rounded-full bg-primary/10 blur-md transition duration-200 group-hover:bg-primary/14 animate-heartbeat [animation-delay:140ms]" />
          <span className="relative z-10 animate-heartbeat">
            <MaterialIcon name="forum" filled className="text-[20px]" />
          </span>
        </Link>
        {onSignOut ? (
          <button
            onClick={onSignOut}
            className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Sign out"
          >
            <MaterialIcon name="logout" />
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function BottomNavigation({
  onAddExpense,
  isAddDisabled,
}: NavigationProps) {
  return (
    <nav className="fixed bottom-3 left-1/2 z-40 grid w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 grid-cols-5 items-center gap-1 rounded-full border border-outline-variant/70 bg-surface-container-lowest/94 px-2 py-2 text-on-surface shadow-ambient backdrop-blur-2xl lg:hidden">
      {navigationItems.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-full px-2 py-2 text-[10px] font-medium tracking-wide transition',
              isActive
                ? 'bg-on-surface text-background'
                : 'text-on-surface-variant hover:text-on-surface',
            )
          }
        >
          <MaterialIcon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
      <button
        onClick={onAddExpense}
        disabled={isAddDisabled}
        className="flex min-w-0 flex-col items-center gap-1 rounded-full bg-on-surface px-2 py-2 text-[10px] font-semibold text-background transition hover:scale-[1.02] disabled:opacity-55"
      >
        <MaterialIcon name="add_circle" filled />
        Add
      </button>
      {navigationItems.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-full px-2 py-2 text-[10px] font-medium tracking-wide transition',
              isActive
                ? 'bg-on-surface text-background'
                : 'text-on-surface-variant hover:text-on-surface',
            )
          }
        >
          <MaterialIcon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function FloatingActionButton({
  onAddExpense,
  isAddDisabled,
}: NavigationProps) {
  return (
    <button
      onClick={onAddExpense}
      disabled={isAddDisabled}
      className="fixed bottom-28 right-5 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-on-surface text-background shadow-ambient transition hover:scale-[1.03] disabled:opacity-55 lg:flex"
      aria-label="Add expense"
    >
      <MaterialIcon name="add" filled className="text-[28px]" />
    </button>
  );
}
