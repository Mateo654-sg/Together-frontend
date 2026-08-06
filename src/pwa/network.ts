/**
 * @module pwa/network
 * @description Estado global de conectividad y cambios pendientes de sincronización.
 */

import { create } from 'zustand';

interface NetworkState {
  online: boolean;
  pendingSync: number;
  setOnline: (online: boolean) => void;
  incrementPending: () => void;
  clearPending: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSync: 0,
  setOnline: (online) => set({ online }),
  incrementPending: () => set((s) => ({ pendingSync: s.pendingSync + 1 })),
  clearPending: () => set({ pendingSync: 0 }),
}));

export function initNetworkListeners(): () => void {
  const handleOnline = () => {
    useNetworkStore.getState().setOnline(true);
    useNetworkStore.getState().clearPending();
  };
  const handleOffline = () => useNetworkStore.getState().setOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
