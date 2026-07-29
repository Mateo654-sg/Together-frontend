import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: 'var(--color-bg-base)',
        }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-danger-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-danger)',
            marginBottom: 'var(--space-4)',
          }}>
            <AlertTriangle size={32} />
          </div>
          <h1 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}>
            Algo salió mal
          </h1>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-6)',
            maxWidth: 400,
          }}>
            {this.state.error?.message || 'Ocurrió un error inesperado en la aplicación.'}
          </p>
          <button className="btn btn--primary" onClick={this.handleRetry}>
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
