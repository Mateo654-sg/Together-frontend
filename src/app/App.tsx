/**
 * @module App
 * @description Raíz de la aplicación Together.
 *
 * Responsabilidades:
 * - Proveer el cliente de React Query con opciones globales (staleTime, retry).
 * - Registrar el callback de logout en el cliente Axios para que el interceptor
 *   de 401 pueda cerrar sesión sin importar el módulo auth-store directamente
 *   (evita dependencias circulares).
 * - Restaurar la sesión desde el refresh token (cookie HttpOnly) en el primer
 *   render y mostrar un loader mientras se resuelve.
 * - Proveer el sistema de notificaciones Toast disponible en toda la app.
 * - Aplicar el tema de usuario (dark/light/system) vía ThemeManager.
 * - Envolver toda la jerarquía en un ErrorBoundary para capturar errores
 *   inesperados sin romper el shell completo.
 */

import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from '@/app/router';
import { PageLoader } from '@/shared/components/PageLoader';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ToastProvider } from '@/shared/components/Toast';
import { ConfirmProvider } from '@/shared/components/ConfirmDialog';
import { ThemeManager } from '@/shared/theme/ThemeManager';
import { PwaSyncToasts } from '@/pwa/PwaSyncToasts';
import { setLogoutCallback } from '@/config/api';
import { useAuthStore } from '@/features/auth/store/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Registrar el logout del interceptor fuera del árbol de componentes para
// evitar que el interceptor Axios tenga una dependencia directa del store.
setLogoutCallback(() => {
  useAuthStore.getState().logout();
});

/**
 * Restaura la sesión en el primer montaje intentando un refresh silencioso.
 * Muestra un PageLoader mientras la petición está en vuelo para evitar un
 * flash de la pantalla de login antes de confirmar la sesión activa.
 */
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { restoreSession, isLoading } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
    // restoreSession es estable (definida en el store con zustand) — una sola ejecución.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || isLoading) return <PageLoader />;
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <ThemeManager />
            <PwaSyncToasts />
            <AppInitializer>
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </AppInitializer>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
      {/* DevTools sólo en desarrollo — Vite elimina este bloque en el build de producción */}
      {import.meta.env.DEV && (
        <ReactQueryDevtoolsLazy />
      )}
    </QueryClientProvider>
  );
}

/**
 * Carga ReactQueryDevtools de forma lazy para que el bundle de producción
 * no incluya el módulo aunque tree-shaking falle.
 */
function ReactQueryDevtoolsLazy() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Devtools, setDevtools] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    import('@tanstack/react-query-devtools').then((m) => {
      setDevtools(() => m.ReactQueryDevtools);
    });
  }, []);
  if (!Devtools) return null;
  return <Devtools initialIsOpen={false} />;
}
