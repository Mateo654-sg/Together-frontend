/**
 * @module GoogleSignInButton
 * @description Botón de autenticación con Google usando la librería GSI (Google Sign-In).
 *
 * Patrón de inicialización:
 * - GSI sólo permite llamar a `initialize()` una vez por sesión de página.
 * - Usamos una ref `callbackRef` para que el callback siempre apunte a las
 *   versiones actuales de `googleLogin` y `navigate` sin necesidad de
 *   re-inicializar GSI en cada render (evita el warning "initialized multiple times").
 * - `renderButton()` se llama en cada montaje para que el botón sea visible.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth-store';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

// Flag global: GSI sólo acepta una inicialización por carga de página.
let gsiInitialized = false;

export default function GoogleSignInButton() {
  const navigate = useNavigate();
  const { googleLogin } = useAuthStore();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  // Ref mutable para que el callback registrado en GSI siempre acceda a las
  // instancias más recientes sin crear una nueva inicialización de GSI.
  const callbackRef = useRef<(response: google.accounts.id.CredentialResponse) => void>(
    async () => {}
  );

  // Mantener el callback actualizado en cada render.
  useEffect(() => {
    callbackRef.current = async (response: google.accounts.id.CredentialResponse) => {
      setError('');
      try {
        await googleLogin(response.credential);
        navigate('/dashboard');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
        setError(message);
      }
    };
  }, [googleLogin, navigate]);

  useEffect(() => {
    if (!window.google?.accounts || !buttonRef.current) return;

    if (!gsiInitialized) {
      // Inicializar GSI una sola vez por sesión; el wrapper llama a callbackRef.current
      // para que siempre use la versión actual del closure.
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current(response),
      });
      gsiInitialized = true;
    }

    // renderButton puede llamarse en cada montaje sin efecto secundario.
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: buttonRef.current.offsetWidth || 340,
      logo_alignment: 'left',
    });
  }, []);

  return (
    <div>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <div ref={buttonRef} className="google-signin-btn" aria-label="Iniciar sesión con Google" />
    </div>
  );
}
