import { NavLink } from 'react-router-dom';
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
  { label: 'Chat', to: '/chat', icon: 'forum' },
  { label: 'Categories', to: '/categories', icon: 'category' },
];

interface NavigationProps {
  onAddExpense: () => void;
  onSignOut?: () => void;
}

export function DesktopSidebar({ onAddExpense, onSignOut }: NavigationProps) {
  return (
    <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-72 lg:flex-col lg:border-r lg:border-black/5 lg:bg-white/70 lg:p-6 lg:backdrop-blur-xl">
      <div>
        <p className="text-xl font-black tracking-tight text-on-surface">
          Wallet Wise
        </p>
        <div className="mt-8 rounded-[1.5rem] bg-surface-container-low p-4">
          <p className="text-sm font-bold text-on-surface">The Curator</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-on-surface-variant">
            Financial mindfulness
          </p>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'translate-x-1 bg-surface-container-lowest text-on-surface shadow-ambient'
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
        {onSignOut ? (
          <button
            onClick={onSignOut}
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-lowest hover:text-on-surface"
          >
            <MaterialIcon name="logout" className="text-[18px]" />
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function MobileTopBar() {
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
      <button className="rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-low">
        <MaterialIcon name="notifications" />
      </button>
    </header>
  );
}

export function BottomNavigation({ onAddExpense }: NavigationProps) {
  return (
    <nav className="glass-panel fixed bottom-0 left-0 z-40 flex w-full items-center justify-around rounded-t-[2rem] px-4 pb-6 pt-2 shadow-ambient lg:hidden">
      {navigationItems.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-full p-3 text-[11px] font-medium tracking-wide transition',
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
        className="flex flex-col items-center gap-1 rounded-full bg-surface-container-high px-4 py-3 text-[11px] font-semibold text-on-surface shadow-ambient"
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
              'flex flex-col items-center gap-1 rounded-full p-3 text-[11px] font-medium tracking-wide transition',
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
