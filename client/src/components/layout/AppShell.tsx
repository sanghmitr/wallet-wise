import { Outlet } from 'react-router-dom';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import {
  BottomNavigation,
  DesktopSidebar,
  FloatingActionButton,
  MobileTopBar,
} from '@/components/layout/navigation';
import { useAppData } from '@/store/AppDataContext';

export function AppShell() {
  const { openCreateExpense, signOut, bootstrapError } = useAppData();

  return (
    <div className="min-h-screen">
      <MobileTopBar onSignOut={() => void signOut()} />
      <DesktopSidebar onAddExpense={openCreateExpense} onSignOut={() => void signOut()} />

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-20 lg:ml-72 lg:px-8 lg:pb-10 lg:pt-8">
        {bootstrapError ? (
          <div className="mb-6 rounded-[1.5rem] border border-error/15 bg-error/5 px-5 py-4 text-sm text-error">
            {bootstrapError}
          </div>
        ) : null}
        <Outlet />
      </main>

      <FloatingActionButton onAddExpense={openCreateExpense} />
      <BottomNavigation onAddExpense={openCreateExpense} />
      <AddExpenseModal />
    </div>
  );
}
