import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BootScreen } from '@/components/app/BootScreen';
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
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
);
const PaymentMethodPage = lazy(() =>
  import('@/pages/PaymentMethodPage').then((module) => ({
    default: module.PaymentMethodPage,
  })),
);

export function App() {
  const {
    isBootstrapping,
    bootstrapStage,
    bootstrapError,
    hasCompletedInitialSync,
    isAuthenticated,
    retryBootstrap,
    signInWithGoogle,
    continueAsGuest,
  } = useAppData();

  if (isBootstrapping) {
    return <BootScreen variant={bootstrapStage} />;
  }

  if (isAuthenticated && !hasCompletedInitialSync) {
    return (
      <BootScreen
        variant="error"
        errorMessage={bootstrapError}
        onRetry={retryBootstrap}
      />
    );
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
    <Suspense fallback={<BootScreen variant="loading" />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/profile/payment-methods/:paymentMethodId"
            element={<PaymentMethodPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
