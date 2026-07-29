import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner">
        <Loader2 size={32} className="page-loader__icon" />
      </div>
      <p className="page-loader__text">Cargando...</p>
    </div>
  );
}
