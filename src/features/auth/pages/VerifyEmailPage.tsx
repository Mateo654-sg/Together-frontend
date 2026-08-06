import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck, MailWarning, Loader2 } from 'lucide-react';
import { authApi } from '@/services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('El enlace de verificación no contiene un token válido.');
      return;
    }
    let cancelled = false;
    authApi.verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'No se pudo verificar el correo.');
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            {status === 'success' ? <MailCheck size={24} /> : status === 'error' ? <MailWarning size={24} /> : <Loader2 size={24} />}
          </div>
          {status === 'loading' && (
            <>
              <h1 className="auth-title">Verificando correo</h1>
              <p className="auth-subtitle">Estamos validando tu dirección de correo electrónico...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className="auth-title">Correo verificado</h1>
              <p className="auth-subtitle">Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión.</p>
              <Link to="/login" className="btn btn--primary btn--full">
                Iniciar sesión
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="auth-title">No se pudo verificar</h1>
              <p className="auth-subtitle">{error}</p>
              <p className="auth-footer">
                <Link to="/login" className="auth-link">Ir a iniciar sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
