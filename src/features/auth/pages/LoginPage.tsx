import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Heart } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!email.trim()) { setLocalError('Ingresa tu correo electrónico'); return; }
    if (!password) { setLocalError('Ingresa tu contraseña'); return; }

    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setLocalError(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Heart size={24} />
          </div>
          <h1 className="auth-title">Together</h1>
          <p className="auth-subtitle">Finanzas de pareja</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {(localError || error) && (
            <div className="alert alert--error">
              {localError || error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); setLocalError(''); }}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); setLocalError(''); }}
                placeholder="••••••••••••"
                autoComplete="current-password"
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

          <div className="auth-actions">
            <Link to="/forgot-password" className="auth-link">¿Olvidaste tu contraseña?</Link>
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={isLoading}>
            {isLoading ? (
              <span className="btn__loader" />
            ) : (
              <><LogIn size={18} /> Iniciar sesión</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
