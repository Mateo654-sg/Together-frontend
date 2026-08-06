/**
 * Service Worker de Together (PWA).
 *
 * Estrategias:
 *  - App shell precacheado + fallback SPA para navegación.
 *  - GET  /api/v1/*  → NetworkFirst con fallback a caché (lectura offline).
 *  - POST/PUT/PATCH/DELETE /api/v1/* → NetworkOnly; si no hay red, la
 *    petición se encola en IndexedDB (Background Sync) y se reenvía cuando
 *    hay conexión, avisando a la app con un mensaje.
 *  - Push local (notificaciones) listo para cuando el backend lo soporte.
 */

/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { Queue } from 'workbox-background-sync';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const API_PREFIX = '/api/v1/';
const isAuthPath = (pathname: string) => pathname.startsWith('/api/v1/auth/');

self.skipWaiting();
clientsClaim();

// ── Precaching del app shell ────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Navegación SPA: red primero, fallback a index.html ──────
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  })
);

// ── Cola de sincronización offline (mutaciones) ─────────────
const syncQueue = new Queue('together-sync', {
  maxRetentionTime: 24 * 60, // minutos
  onSync: async ({ queue }) => {
    let entry: Awaited<ReturnType<Queue['shiftRequest']>>;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone());
        if (!response.ok && response.status !== 401 && response.status !== 403) {
          throw new Error(`Reintento fallido (${response.status})`);
        }
        notifyClients({ type: 'TOGETHER:SYNC_SUCCESS' });
      } catch {
        await queue.unshiftRequest(entry);
        notifyClients({ type: 'TOGETHER:SYNC_FAILED' });
        return;
      }
    }
  },
});

// ── API: lecturas con caché, mutaciones con cola offline ────
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith(API_PREFIX) && !isAuthPath(url.pathname) && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'together-api',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
    networkTimeoutSeconds: 4,
  })
);

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith(API_PREFIX) && !isAuthPath(url.pathname) && request.method !== 'GET',
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch {
      // Sin conexión: encolamos la mutación y respondemos 202.
      try {
        await syncQueue.pushRequest({ request });
      } catch {
        // Si no hay IndexedDB disponible, devolvemos el error de red real.
        return new Response(null, { status: 503 });
      }
      notifyClients({ type: 'TOGETHER:QUEUED', url: request.url });
      return new Response(
        JSON.stringify({ queued: true, message: 'Guardado sin conexión. Se sincronizará automáticamente.' }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json', 'X-Together-Queued': '1' },
        }
      );
    }
  }
);

// ── Push / notificaciones (backend push-ready) ──────────────
self.addEventListener('push', (event) => {
  let payload: { title?: string; body?: string; url?: string; icon?: string } = {};
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    /* payload no JSON */
  }

  const title = payload.title || 'Together';
  const options: NotificationOptions = {
    body: payload.body || '',
    icon: payload.icon || '/icons/pwa-192x192.png',
    badge: '/icons/pwa-192x192.png',
    data: { url: payload.url || '/' },
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'TOGETHER:NAVIGATE', url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ── Puente de mensajes con la app ───────────────────────────
function notifyClients(message: Record<string, unknown>) {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => clients.forEach((client) => client.postMessage(message)))
    .catch(() => undefined);
}

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
