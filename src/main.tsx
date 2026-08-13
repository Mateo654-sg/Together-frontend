import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@styles/index.css';
import { ToastProvider } from '@/shared/components/Toast';
import { ThemeManager } from '@/shared/theme/ThemeManager';
import { initNetworkListeners } from '@/pwa/network';
import { initSyncBridge } from '@/pwa/syncBridge';
import { PwaSyncToasts } from '@/pwa/PwaSyncToasts';

initNetworkListeners();
initSyncBridge();

function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
  let shouldReload = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (shouldReload) window.location.reload();
  });

  void navigator.serviceWorker
    .register(swUrl, { scope: '/', updateViaCache: 'none' })
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;

        // Solo recargamos si hay un SW previo (actualización), no en la primera instalación.
        const isUpdate = Boolean(navigator.serviceWorker.controller || registration.active);
        worker.addEventListener('statechange', () => {
          if (isUpdate && worker.state === 'installed') {
            shouldReload = true;
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // iOS/Safari no revisa actualizaciones del SW de forma fiable en cada arranque:
      // forzamos la comprobación en cada carga.
      registration.update().catch(() => undefined);
    })
    .catch(() => undefined);
}

setupServiceWorker();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ToastProvider>
      <ThemeManager />
      <PwaSyncToasts />
      <App />
    </ToastProvider>
  </StrictMode>
);
