import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; opts: ConfirmOptions }>({
    open: false,
    opts: { message: '' },
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, opts });
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="modal-overlay" onClick={handleCancel} style={{ zIndex: 9999 }}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 380 }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-warning)' }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0 }}>{state.opts.title ?? 'Confirmar acción'}</h3>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={handleCancel} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0 }}>{state.opts.message}</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost btn--sm" onClick={handleCancel}>Cancelar</button>
              <button className="btn btn--danger btn--sm" onClick={handleConfirm}>
                {state.opts.confirmLabel ?? 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
