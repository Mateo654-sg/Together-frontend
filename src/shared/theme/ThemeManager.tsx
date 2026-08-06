import { useEffect } from 'react';
import { usersApi } from '@/services/api';

function applyTheme(theme: string) {
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const effective = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
  document.documentElement.setAttribute('data-theme', effective);
}

export function ThemeManager() {
  useEffect(() => {
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
        // Sin autenticar: se conserva el tema por defecto del CSS.
      });
    return () => unsub?.();
  }, []);

  return null;
}
