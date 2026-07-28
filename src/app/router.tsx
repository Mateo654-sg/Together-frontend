/**
 * @module router
 * @description React Router v7 — reemplaza react-navigation (React Native).
 * Rutas protegidas con PrivateRoute. Lazy loading de páginas.
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth-store';
import AppLayout from '@/shared/components/AppLayout';
import PageLoader from '@/shared/components/PageLoader';

// ── Lazy pages ────────────────────────────────────────────────
const LoginPage       = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage    = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPage      = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));

const DashboardPage   = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ExpensesPage    = lazy(() => import('@/features/expenses/pages/ExpensesPage'));
const ExpenseDetail   = lazy(() => import('@/features/expenses/pages/ExpenseDetailPage'));
const GoalsPage       = lazy(() => import('@/features/goals/pages/GoalsPage'));
const GoalDetail      = lazy(() => import('@/features/goals/pages/GoalDetailPage'));
const ActivityPage    = lazy(() => import('@/features/activity/pages/ActivityPage'));
const AIPage          = lazy(() => import('@/features/ai/pages/AIPage'));
const ProfilePage     = lazy(() => import('@/features/profile/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'));
const ReportsPage     = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsPage    = lazy(() => import('@/features/profile/pages/SettingsPage'));

// ── Guards ────────────────────────────────────────────────────
function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireGuest() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ── Router ────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Auth (guest only) ─────────────────────────────────────
  {
    element: <RequireGuest />,
    children: [
      {
        path: '/login',
        element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
      },
      {
        path: '/register',
        element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper>,
      },
      {
        path: '/forgot-password',
        element: <SuspenseWrapper><ForgotPage /></SuspenseWrapper>,
      },
    ],
  },
  // ── App (authenticated) ───────────────────────────────────
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: '/dashboard',
            element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>,
          },
          {
            path: '/expenses',
            element: <SuspenseWrapper><ExpensesPage /></SuspenseWrapper>,
          },
          {
            path: '/expenses/:id',
            element: <SuspenseWrapper><ExpenseDetail /></SuspenseWrapper>,
          },
          {
            path: '/goals',
            element: <SuspenseWrapper><GoalsPage /></SuspenseWrapper>,
          },
          {
            path: '/goals/:id',
            element: <SuspenseWrapper><GoalDetail /></SuspenseWrapper>,
          },
          {
            path: '/activity',
            element: <SuspenseWrapper><ActivityPage /></SuspenseWrapper>,
          },
          {
            path: '/ai',
            element: <SuspenseWrapper><AIPage /></SuspenseWrapper>,
          },
          {
            path: '/profile',
            element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper>,
          },
          {
            path: '/notifications',
            element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper>,
          },
          {
            path: '/reports',
            element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper>,
          },
          {
            path: '/settings',
            element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper>,
          },
        ],
      },
    ],
  },
  // ── Fallback ──────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);
