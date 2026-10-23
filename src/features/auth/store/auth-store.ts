/**
 * @module auth-store
 * @description Store global de autenticación con Zustand.
 *
 * Flujo de tokens:
 * - Access token: guardado en memoria (tokenStore) — nunca en localStorage
 *   para evitar ataques XSS.
 * - Refresh token: viaja en cookie HttpOnly del mismo origen. El backend lo
 *   rota en cada uso (Refresh Token Rotation) e invalida el anterior.
 *
 * Ciclo de vida de sesión:
 * 1. `restoreSession()` se llama al montar App — intenta renovar el access
 *    token con el refresh token existente en la cookie.
 * 2. El interceptor de Axios llama automáticamente a `/auth/refresh` ante un
 *    401 y, si falla, invoca el callback de logout registrado en `setLogoutCallback`.
 * 3. `logout()` borra el token en memoria, llama a `/auth/logout` para
 *    invalidar el refresh token en el servidor y limpia los cachés de la PWA.
 */

import { create } from 'zustand';
import { authApi, usersApi, tokenStorage } from '@/services/api';
import { clearApiCaches } from '@/pwa/syncBridge';
import type { LoginInput, RegisterInput, User } from '@/types/api';

/**
 * Token de verificación de email generado por el backend en el registro.
 * Se almacena de forma efímera en módulo (no en store) para evitar exponerlo
 * en DevTools y pasarlo una sola vez a VerifyEmailPage via `consumeVerificationToken`.
 */
let pendingVerificationToken: string | null = null;

export function consumeVerificationToken(): string | null {
  const token = pendingVerificationToken;
  pendingVerificationToken = null;
  return token;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  restoreSession: () => Promise<void>;
}

type SetFn = (partial: Partial<AuthState>) => void;

async function handleAuthLogin(
  set: SetFn,
  tokenPromise: Promise<{ access_token?: string }>,
  errorLabel: string,
) {
  set({ isLoading: true, error: null });
  try {
    const tokens = await tokenPromise;
    if (tokens?.access_token) {
      const user = await usersApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false, error: 'No se recibieron tokens' });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : errorLabel;
    tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false, error: message });
    throw error;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: (input) => handleAuthLogin(set, authApi.login(input), 'Login failed'),

  googleLogin: (idToken) => handleAuthLogin(set, authApi.googleLogin(idToken), 'Google login failed'),

  register: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.register(input);
      if (tokens?.verification_token) {
        pendingVerificationToken = tokens.verification_token;
      }
      set({ isLoading: false, isAuthenticated: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.logout();
    } catch {
      // silent
    } finally {
      tokenStorage.clearTokens();
      void clearApiCaches();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshAuth: async () => {
    try {
      await authApi.refresh();
    } catch {
      tokenStorage.clearTokens();
      void clearApiCaches();
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),

  clearError: () => set({ error: null }),

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      await authApi.refresh();
      const user = await usersApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      tokenStorage.clearTokens();
      void clearApiCaches();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
