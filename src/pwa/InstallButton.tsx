import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/pwa/install';

/**
 * Botón de instalación de la PWA. Se muestra únicamente cuando el
 * navegador dispara beforeinstallprompt y el usuario no lo descartó.
 */
export function InstallButton() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="install-card">
      <div className="install-card__info">
        <Download size={18} />
        <span>Instala Together en tu dispositivo</span>
      </div>
      <div className="install-card__actions">
        <button className="btn btn--sm btn--primary" onClick={promptInstall}>
          <Download size={14} /> Instalar
        </button>
        <button className="install-card__close" onClick={dismiss} aria-label="Descartar">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
