/**
 * @module pwa/install
 * @description Hook y componente para la instalación de la PWA
 * (evento beforeinstallprompt) con persistencia del cierre del aviso.
 * Incluye detección de iOS Safari, donde beforeinstallprompt no existe.
 */

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'together:pwa-install-dismissed';
const RE_SHOW_DAYS = 3;

function readDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return true;
    return Date.now() < ts;
  } catch {
    return false;
  }
}

function writeDismissed(untilTs: number) {
  try {
    localStorage.setItem(DISMISSED_KEY, String(untilTs));
  } catch {
    /* noop */
  }
}

export type InstallSource = 'prompt' | 'ios' | null;

interface UseInstallPromptResult {
  /** Disponible y no descartado. */
  canInstall: boolean;
  /** Detección del navegador: evento beforeinstallprompt o iOS Safari. */
  source: InstallSource;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      writeDismissed(Date.now() + 365 * 24 * 60 * 60 * 1000);
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
      writeDismissed(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDeferredPrompt(null);
    writeDismissed(Date.now() + RE_SHOW_DAYS * 24 * 60 * 60 * 1000);
  }, []);

  const source: InstallSource = deferredPrompt
    ? 'prompt'
    : isIosSafari() && !isStandalone()
      ? 'ios'
      : null;

  return {
    canInstall: Boolean(source) && !dismissed,
    source,
    promptInstall,
    dismiss,
  };
}

/** Detecta iOS Safari (no soporta beforeinstallprompt). */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iOS && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error navegador propietario iOS
    Boolean(window.navigator.standalone)
  );
}
