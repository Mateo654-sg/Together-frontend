import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth-store';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

// GSI solo admite una inicialización global; el flag evita el warning
// "google.accounts.id.initialize() is called multiple times" al remontar
// la página de login.
let gsiInitialized = false;

export default function GoogleSignInButton() {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!window.google?.accounts || !buttonRef.current) return;

    if (!gsiInitialized) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: google.accounts.id.CredentialResponse) => {
          try {
            await googleLogin(response.credential);
            navigate('/dashboard');
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
            setError(message);
          }
        },
      });
      gsiInitialized = true;
    }

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: buttonRef.current.offsetWidth || 340,
      logo_alignment: 'left',
    });
  }, [googleLogin, navigate]);

  return (
    <div>
      {error && <div className="alert alert--error">{error}</div>}
      <div ref={buttonRef} className="google-signin-btn" />
    </div>
  );
}
