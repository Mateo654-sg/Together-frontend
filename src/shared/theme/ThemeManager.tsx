import { useEffect } from 'react';
import { usersApi } from '@/services/api';
import { useAuthStore } from '@/features/auth/store/auth-store';

function applyTheme(theme: string) {
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const effective = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

export function ThemeManager() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Sin sesión no hay tema de usuario que consultar; se conserva el del CSS
    // y se evita un 401 en /users/settings (y el refresh redundante del interceptor).
    if (!isAuthenticated) return;

    let unsub: (() => void) | null = null;
    usersApi.getSettings()
      .then((settings) => {
        const theme = settings.theme || 'dark';
        applyTheme(theme);
        if (theme === 'system') {
          const media = window.matchMedia('(prefers-color-scheme: light)');
          const listener = () => applyTheme(theme);
          media.addEventListener('change', listener);
          unsub = () => media.removeEventListener('change', listener);
        }
      })
      .catch(() => {
        // Fallo al leer el tema: se conserva el tema por defecto del CSS.
      });
    return () => unsub?.();
  }, [isAuthenticated]);

  return null;
}
