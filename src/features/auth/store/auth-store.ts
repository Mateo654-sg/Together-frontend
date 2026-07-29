/**
 * @module auth-store
 * @description Store de autenticación con Zustand. Usa localStorage en lugar de AsyncStorage/SecureStore.
 */
import { create } from 'zustand';
import { authApi, usersApi, tokenStorage } from '@/services/api';
import type { LoginInput, RegisterInput, User } from '@/types/api';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.login(input);
      if (tokens?.access_token) {
        const user = await usersApi.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false, error: 'No se recibieron tokens' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: message });
      throw error;
    }
  },

  googleLogin: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.googleLogin(idToken);
      if (tokens?.access_token) {
        const user = await usersApi.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false, error: 'No se recibieron tokens' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google login failed';
      tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: message });
      throw error;
    }
  },

  register: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.register(input);
      if (tokens?.access_token) {
        const user = await usersApi.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false, error: 'No se recibieron tokens' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: message });
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
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshAuth: async () => {
    try {
      await authApi.refresh();
    } catch {
      tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),

  clearError: () => set({ error: null }),

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const accessToken = tokenStorage.getAccessToken();

      if (!accessToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      await authApi.refresh();
      const user = await usersApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
