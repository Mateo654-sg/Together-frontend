/**
 * @module pwa/syncBridge
 * @description Puente de mensajes Service Worker ↔ app.
 * Reacciona a los mensajes del SW (cola offline, sincronización) y los
 * traduce a eventos que la UI puede escuchar (toasts, contador de pendientes).
 */

import { useNetworkStore } from './network';

export const syncEvents = new EventTarget();

export type SyncEventType = 'queued' | 'synced' | 'sync-failed' | 'navigate';

export function emitSyncEvent(type: SyncEventType, detail?: unknown) {
  syncEvents.dispatchEvent(new CustomEvent(type, { detail }));
}

interface SwMessage {
  type?: string;
  url?: string;
}

export function initSyncBridge(): () => void {
  if (!('serviceWorker' in navigator)) return () => undefined;

  const handleMessage = (event: MessageEvent) => {
    const data = event.data as SwMessage | undefined;
    if (!data?.type) return;

    switch (data.type) {
      case 'TOGETHER:QUEUED':
        useNetworkStore.getState().incrementPending();
        emitSyncEvent('queued', data);
        break;
      case 'TOGETHER:SYNC_SUCCESS':
        useNetworkStore.getState().clearPending();
        emitSyncEvent('synced', data);
        break;
      case 'TOGETHER:SYNC_FAILED':
        emitSyncEvent('sync-failed', data);
        break;
      case 'TOGETHER:NAVIGATE':
        emitSyncEvent('navigate', data);
        break;
      default:
        break;
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);
  return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
}

/** Elimina la caché de la API (protección de datos entre usuarios). */
export async function clearApiCaches(): Promise<void> {
  if (!('caches' in window)) return;
  try {
    await caches.delete('together-api');
  } catch {
    /* noop */
  }
}
