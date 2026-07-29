import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { AppLayout } from '@/shared/components/AppLayout';
import { PageLoader } from '@/shared/components/PageLoader';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ExpensesPage = lazy(() => import('@/features/expenses/pages/ExpensesPage'));
const ExpenseDetailPage = lazy(() => import('@/features/expenses/pages/ExpenseDetailPage'));
const GoalsPage = lazy(() => import('@/features/goals/pages/GoalsPage'));
const GoalDetailPage = lazy(() => import('@/features/goals/pages/GoalDetailPage'));
const ActivityPage = lazy(() => import('@/features/activity/pages/ActivityPage'));
const AIPage = lazy(() => import('@/features/ai/pages/AIPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/features/profile/pages/SettingsPage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireGuest() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function Router() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
        <Route path="/register" element={<SuspenseWrapper><RegisterPage /></SuspenseWrapper>} />
        <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
          <Route path="/expenses" element={<SuspenseWrapper><ExpensesPage /></SuspenseWrapper>} />
          <Route path="/expenses/:id" element={<SuspenseWrapper><ExpenseDetailPage /></SuspenseWrapper>} />
          <Route path="/goals" element={<SuspenseWrapper><GoalsPage /></SuspenseWrapper>} />
          <Route path="/goals/:id" element={<SuspenseWrapper><GoalDetailPage /></SuspenseWrapper>} />
          <Route path="/activity" element={<SuspenseWrapper><ActivityPage /></SuspenseWrapper>} />
          <Route path="/ai" element={<SuspenseWrapper><AIPage /></SuspenseWrapper>} />
          <Route path="/profile" element={<SuspenseWrapper><ProfilePage /></SuspenseWrapper>} />
          <Route path="/notifications" element={<SuspenseWrapper><NotificationsPage /></SuspenseWrapper>} />
          <Route path="/reports" element={<SuspenseWrapper><ReportsPage /></SuspenseWrapper>} />
          <Route path="/settings" element={<SuspenseWrapper><SettingsPage /></SuspenseWrapper>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
