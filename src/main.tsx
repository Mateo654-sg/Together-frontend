import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@styles/index.css';
import { registerSW } from 'virtual:pwa-register';
import { ToastProvider } from '@/shared/components/Toast';


registerSW({
  onNeedRefresh() { window.location.reload(); },
  onOfflineReady() {},
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
