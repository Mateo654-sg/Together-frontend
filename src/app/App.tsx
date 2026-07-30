import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Router } from '@/app/router';
import { PageLoader } from '@/shared/components/PageLoader';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { setLogoutCallback } from '@/config/api';
import { useAuthStore } from '@/features/auth/store/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

setLogoutCallback(() => {
  useAuthStore.getState().logout();
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { restoreSession, isLoading } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
  }, []);

  if (!ready || isLoading) return <PageLoader />;
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </AppInitializer>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
