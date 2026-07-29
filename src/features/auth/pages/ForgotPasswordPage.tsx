import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Heart, ArrowLeft } from 'lucide-react';
import { authApi } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) { setLocalError('Ingresa tu correo electrónico'); return; }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar el correo';
      setLocalError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Heart size={24} />
            </div>
            <h1 className="auth-title">Revisa tu correo</h1>
            <p className="auth-subtitle">
              Si existe una cuenta con {email}, recibirás instrucciones para restablecer tu contraseña.
            </p>
          </div>
          <Link to="/login" className="btn btn--secondary btn--full">
            <ArrowLeft size={18} /> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Heart size={24} />
          </div>
          <h1 className="auth-title">Recuperar contraseña</h1>
          <p className="auth-subtitle">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {localError && <div className="alert alert--error">{localError}</div>}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? <span className="btn__loader" /> : <><Send size={18} /> Enviar enlace</>}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login" className="auth-link">
            <ArrowLeft size={14} /> Volver a inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
