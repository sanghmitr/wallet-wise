import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/layout/AppShell';
import { useAppData } from '@/store/AppDataContext';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const BudgetsPage = lazy(() =>
  import('@/pages/BudgetsPage').then((module) => ({
    default: module.BudgetsPage,
  })),
);
const ChatPage = lazy(() =>
  import('@/pages/ChatPage').then((module) => ({
    default: module.ChatPage,
  })),
);
const CategoriesPage = lazy(() =>
  import('@/pages/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  })),
);

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-[2rem] bg-white/80 px-6 py-4 text-sm font-semibold text-on-surface shadow-ambient backdrop-blur-xl">
        Loading Wallet Wise...
      </div>
    </div>
  );
}

export function App() {
  const {
    isBootstrapping,
    bootstrapError,
    isAuthenticated,
    signInWithGoogle,
    continueAsGuest,
  } = useAppData();

  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <AuthGate
        bootstrapError={bootstrapError}
        onGoogleSignIn={signInWithGoogle}
        onContinueAsGuest={continueAsGuest}
      />
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
