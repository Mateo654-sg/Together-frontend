import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useInstallPrompt } from '@/pwa/install';
import { useNetworkStore } from '@/pwa/network';

const SHOWN_KEY = 'together:pwa-install-shown-at';

function shouldAutoShow(): boolean {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    if (!raw) return true;
    // Solo autodmostrar una vez por sesión; si lo cierran, no reaparece sola.
    return Date.now() > Number(raw) + 60 * 1000;
  } catch {
    return true;
  }
}

/**
 * Aviso flotante de instalación que aparece al entrar desde el celular:
 *  - Android/Chrome: dispara el prompt nativo (beforeinstallprompt).
 *  - iOS Safari: instrucciones para "Añadir a pantalla de inicio".
 * Se autocierra si no se interactúa.
 */
export function InstallPromptBanner() {
  const { canInstall, source, promptInstall, dismiss } = useInstallPrompt();
  const online = useNetworkStore((s) => s.online);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setVisible(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!canInstall || !online || !isMobile) {
      setVisible(false);
      return;
    }
    // pequeño retraso para no interrumpir el primer render
    const timer = setTimeout(() => {
      if (shouldAutoShow()) setVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [canInstall, online, isMobile]);

  if (!canInstall || !visible) return null;

  const handleInstall = async () => {
    if (source === 'prompt') {
      await promptInstall();
    } else {
      // iOS: instrucciones manuales
      dismiss();
    }
    setVisible(false);
  };

  return (
    <div className="install-prompt" role="dialog" aria-label="Instalar aplicación">
      <div className="install-prompt__icon">
        <Download size={22} />
      </div>
      <div className="install-prompt__body">
        <p className="install-prompt__title">Instala Together en tu celular</p>
        {source === 'ios' ? (
          <p className="install-prompt__text">
            Toca <Share size={13} /> Compartir y elige{' '}
            <strong>&quot;Añadir a pantalla de inicio&quot;</strong> para usarla como una app.
          </p>
        ) : (
          <p className="install-prompt__text">Accede rápido desde tu pantalla principal, incluso sin conexión.</p>
        )}
      </div>
      <div className="install-prompt__actions">
        <button className="btn btn--sm btn--primary" onClick={handleInstall}>
          <Download size={14} /> {source === 'ios' ? 'Cómo instalar' : 'Instalar'}
        </button>
        <button
          className="install-prompt__close"
          onClick={() => { dismiss(); setVisible(false); }}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
