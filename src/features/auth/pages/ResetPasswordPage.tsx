import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Heart, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) { setError('Token inválido o expirado'); return; }
    if (!password) { setError('Ingresa tu nueva contraseña'); return; }
    if (password.length < 12) { setError('La contraseña debe tener al menos 12 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al restablecer la contraseña';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo"><Heart size={24} /></div>
            <h1 className="auth-title">Enlace inválido</h1>
            <p className="auth-subtitle">Este enlace de restablecimiento no es válido o ha expirado.</p>
          </div>
          <Link to="/forgot-password" className="btn btn--secondary btn--full">
            <ArrowLeft size={18} /> Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo"><Heart size={24} /></div>
            <h1 className="auth-title">Contraseña restablecida</h1>
            <p className="auth-subtitle">Tu contraseña se ha actualizado correctamente.</p>
          </div>
          <button className="btn btn--primary btn--full" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo"><Heart size={24} /></div>
          <h1 className="auth-title">Nueva contraseña</h1>
          <p className="auth-subtitle">Ingresa tu nueva contraseña.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="alert alert--error">{error}</div>}

          <div className="form-group">
            <label htmlFor="password" className="form-label">Nueva contraseña</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Mín. 12 caracteres"
                autoComplete="new-password"
                autoFocus
                required
              />
              <button
                type="button"
                className="input-suffix"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? <span className="btn__loader" /> : <><Lock size={18} /> Restablecer contraseña</>}
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
