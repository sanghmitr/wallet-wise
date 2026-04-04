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
  onAddExpense: () => void;
  onSignOut?: () => void;
}

export function DesktopSidebar({ onAddExpense, onSignOut }: NavigationProps) {
  return (
    <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-72 lg:flex-col lg:border-r lg:border-outline-variant/20 lg:bg-surface-container-low/88 lg:p-6 lg:backdrop-blur-xl">
      <p className="text-xl font-black tracking-tight text-on-surface">
        Wallet Wise
      </p>

      <nav className="mt-10 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'translate-x-1 bg-primary-container text-on-primary-container shadow-ambient'
                  : 'text-on-surface-variant hover:bg-surface-container-low',
              )
            }
          >
            <MaterialIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <Button className="mt-6 gap-2" onClick={onAddExpense}>
        <MaterialIcon name="add" filled />
        Add Transaction
      </Button>

      <div className="mt-auto rounded-[1.75rem] bg-surface-container-low p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
          AI Assistant
        </p>
        <p className="mt-2 text-sm leading-6 text-on-surface">
          Ask for spend summaries, category totals, or add expenses in plain
          language.
        </p>
        <Link
          to="/chat"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-ambient transition hover:bg-primary-dim"
        >
          <MaterialIcon name="forum" className="text-[18px]" />
          Open Assistant
        </Link>
        {onSignOut ? (
          <button
            onClick={onSignOut}
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-lowest hover:text-on-surface"
          >
            <MaterialIcon name="logout" className="text-[18px]" />
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function MobileTopBar({ onSignOut }: Pick<NavigationProps, 'onSignOut'>) {
  return (
    <header className="glass-panel fixed left-0 top-0 z-40 flex w-full items-center justify-between px-5 py-4 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
          <MaterialIcon name="account_balance_wallet" filled className="text-[20px]" />
        </div>
        <p className="text-base font-bold tracking-tight text-on-surface">
          Wallet Wise
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Link
          to="/chat"
          className="rounded-full p-2 text-on-surface-variant transition hover:bg-primary-container hover:text-on-primary-container"
          aria-label="Open AI assistant"
        >
          <MaterialIcon name="forum" />
        </Link>
        {onSignOut ? (
          <button
            onClick={onSignOut}
            className="rounded-full p-2 text-on-surface-variant transition hover:bg-primary-container hover:text-on-primary-container"
            aria-label="Sign out"
          >
            <MaterialIcon name="logout" />
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function BottomNavigation({ onAddExpense }: NavigationProps) {
  return (
    <nav className="glass-panel fixed bottom-0 left-0 z-40 grid w-full grid-cols-5 items-center gap-1 rounded-t-[2rem] px-3 pb-6 pt-2 shadow-ambient lg:hidden">
      {navigationItems.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-[1.2rem] px-1 py-3 text-[10px] font-medium tracking-wide transition',
              isActive
                ? 'text-on-surface'
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
        className="flex min-w-0 flex-col items-center gap-1 rounded-[1.2rem] bg-primary px-1 py-3 text-[10px] font-semibold text-on-primary shadow-ambient"
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
              'flex min-w-0 flex-col items-center gap-1 rounded-[1.2rem] px-1 py-3 text-[10px] font-medium tracking-wide transition',
              isActive
                ? 'text-on-surface'
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

export function FloatingActionButton({ onAddExpense }: NavigationProps) {
  return (
    <button
      onClick={onAddExpense}
      className="fixed bottom-28 right-5 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-ambient transition hover:bg-primary-dim lg:flex"
      aria-label="Add expense"
    >
      <MaterialIcon name="add" filled className="text-[28px]" />
    </button>
  );
}
