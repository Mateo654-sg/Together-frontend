import { useEffect } from 'react';
import { useToast } from '@/shared/components/Toast';
import { syncEvents } from '@/pwa/syncBridge';

/**
 * Traduce los eventos del service worker (cola offline / sincronización)
 * a toasts visibles para el usuario. Debe montarse dentro de ToastProvider.
 */
export function PwaSyncToasts() {
  const { toast } = useToast();

  useEffect(() => {
    const onQueued = () => toast('info', 'Guardado sin conexión. Se sincronizará automáticamente.');
    const onSynced = () => toast('success', 'Cambios sincronizados correctamente.');
    const onFailed = () => toast('warning', 'No se pudieron sincronizar algunos cambios. Se reintentará.');

    syncEvents.addEventListener('queued', onQueued);
    syncEvents.addEventListener('synced', onSynced);
    syncEvents.addEventListener('sync-failed', onFailed);

    return () => {
      syncEvents.removeEventListener('queued', onQueued);
      syncEvents.removeEventListener('synced', onSynced);
      syncEvents.removeEventListener('sync-failed', onFailed);
    };
  }, [toast]);

  return null;
}
