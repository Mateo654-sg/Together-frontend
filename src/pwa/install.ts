/**
 * @module pwa/install
 * @description Hook y componente para la instalación de la PWA
 * (evento beforeinstallprompt) con persistencia del cierre del aviso.
 */

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'together:pwa-install-dismissed';

interface UseInstallPromptResult {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      try {
        localStorage.setItem(DISMISSED_KEY, '1');
      } catch {
        /* noop */
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      try {
        localStorage.setItem(DISMISSED_KEY, '1');
      } catch {
        /* noop */
      }
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDeferredPrompt(null);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* noop */
    }
  }, []);

  const canInstall = Boolean(deferredPrompt) && !dismissed;

  return { canInstall, promptInstall, dismiss };
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error navegador propietario iOS
    Boolean(window.navigator.standalone)
  );
}
