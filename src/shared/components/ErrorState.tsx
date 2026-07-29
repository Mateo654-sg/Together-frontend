import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Ocurrió un error inesperado', onRetry }: ErrorStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon empty-state__icon--error">
        <AlertTriangle size={32} />
      </div>
      <h3 className="empty-state__title">Algo salió mal</h3>
      <p className="empty-state__message">{message}</p>
      {onRetry && (
        <button className="btn btn--secondary btn--sm" onClick={onRetry}>
          <RefreshCw size={14} /> Reintentar
        </button>
      )}
    </div>
  );
}
