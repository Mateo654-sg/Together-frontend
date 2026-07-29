import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Heart } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!firstName.trim()) { setLocalError('Ingresa tu nombre'); return; }
    if (!lastName.trim()) { setLocalError('Ingresa tu apellido'); return; }
    if (!email.trim()) { setLocalError('Ingresa tu correo electrónico'); return; }
    if (!password) { setLocalError('Ingresa tu contraseña'); return; }

    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
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
          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-subtitle">Comienza a gestionar tus finanzas en pareja</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {(localError || error) && (
            <div className="alert alert--error">{localError || error}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">Nombre</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearError(); setLocalError(''); }}
                placeholder="Juan"
                autoComplete="given-name"
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Apellido</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearError(); setLocalError(''); }}
                placeholder="Pérez"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); setLocalError(''); }}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
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
                placeholder="Mín. 12 caracteres"
                autoComplete="new-password"
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

          <button type="submit" className="btn btn--primary btn--full" disabled={isLoading}>
            {isLoading ? (
              <span className="btn__loader" />
            ) : (
              <><UserPlus size={18} /> Crear cuenta</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="auth-link">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
