import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStore } from '@/pwa/network';

/**
 * Banner global de conectividad: se muestra cuando hay cambios pendientes
 * de sincronizar o cuando el dispositivo está sin conexión.
 */
export function OfflineBanner() {
  const online = useNetworkStore((s) => s.online);
  const pendingSync = useNetworkStore((s) => s.pendingSync);

  if (online && pendingSync === 0) return null;

  return (
    <div
      className={`offline-banner ${online ? 'offline-banner--sync' : ''}`}
      role="status"
      aria-live="polite"
    >
      {online ? (
        <>
          <RefreshCw size={14} />
          <span>Cambios pendientes de sincronizar ({pendingSync})</span>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          <span>Sin conexión: los cambios se guardarán en tu dispositivo</span>
        </>
      )}
    </div>
  );
}
