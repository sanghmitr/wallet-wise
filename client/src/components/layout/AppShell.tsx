import { Outlet } from 'react-router-dom';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import { Button } from '@/components/ui/Button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import {
  BottomNavigation,
  DesktopSidebar,
  MobileTopBar,
} from '@/components/layout/navigation';
import { useAppData } from '@/store/AppDataContext';

export function AppShell() {
  const {
    openCreateExpense,
    signOut,
    bootstrapError,
    serverStatus,
    serverStatusMessage,
    wakeServer,
  } = useAppData();

  const isServerReady = serverStatus === 'ready';
  const isWakingServer = serverStatus === 'waking-server';

  return (
    <div className="min-h-screen font-display">
      <div className="app-shell-backdrop" />
      <MobileTopBar
        onSignOut={() => void signOut()}
        serverStatus={serverStatus}
        onWakeServer={() => void wakeServer()}
      />
      <DesktopSidebar
        onAddExpense={openCreateExpense}
        onSignOut={() => void signOut()}
        serverStatus={serverStatus}
        onWakeServer={() => void wakeServer()}
      />

      <main className="relative mx-auto max-w-7xl px-5 pb-28 pt-24 sm:px-6 lg:ml-[19rem] lg:px-8 lg:pb-10 lg:pt-6">
        {bootstrapError ? (
          <div className="mb-6 rounded-[1.5rem] border border-error/20 bg-error/6 px-5 py-4 text-sm text-error shadow-ambient">
            {bootstrapError}
          </div>
        ) : null}

        {!isServerReady ? (
          <div className="mb-6 overflow-hidden rounded-[1.75rem] border border-outline-variant/70 bg-surface-container-lowest/84 px-5 py-4 shadow-ambient backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-primary">
                  <MaterialIcon
                    name={isWakingServer ? 'cloud_sync' : 'cloud_off'}
                    className={`text-[21px] ${isWakingServer ? 'animate-pulse' : ''}`}
                  />
                </div>
                <div>
                  <p className="font-display text-base font-medium tracking-[-0.02em] text-on-surface">
                    {isWakingServer
                      ? 'Server is waking up'
                      : serverStatus === 'checking'
                        ? 'Checking server status'
                        : 'Server is unavailable for changes'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {serverStatusMessage ??
                      'Writes are temporarily disabled. Wake the backend first, then continue with edits or new transactions.'}
                  </p>
                </div>
              </div>

              <Button
                className="shrink-0 gap-2"
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
          </div>
        ) : null}
        <Outlet />
      </main>

      <BottomNavigation
        onAddExpense={openCreateExpense}
        isAddDisabled={!isServerReady}
      />
      <AddExpenseModal />
    </div>
  );
}
