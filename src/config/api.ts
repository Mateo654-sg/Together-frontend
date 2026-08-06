/**
 * @module api/client
 * @description Cliente HTTP (Axios) con interceptores JWT, refresh automático vía cookie HttpOnly y cola de reintentos.
 */

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { ApiResponse } from '@/types/api';
import { tokenStore } from './token-store';

const DEV_API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// En producción la API se sirve desde el mismo origen (proxy en vercel.json),
// de modo que el refresh token vive en cookie HttpOnly y se envía automáticamente.
const API_BASE_URL = import.meta.env.PROD ? '/api/v1' : DEV_API_URL;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let _onLogout: (() => void) | null = null;

export const setLogoutCallback = (cb: () => void) => {
  _onLogout = cb;
};

// ── Token Storage (solo access token en memoria; refresh en cookie HttpOnly) ──
export const tokenStorage = {
  getAccessToken(): string | null {
    return tokenStore.get();
  },
  setAccessToken(token: string): void {
    tokenStore.set(token);
  },
  clearTokens(): void {
    tokenStore.clear();
  },
};

// ── Axios Instance ─────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// ── Request Interceptor ────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor (auto refresh vía cookie) ────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _url?: string;
    };

    if (!originalRequest._url) {
      originalRequest._url = originalRequest.url ?? '';
    }

    const AUTH_PATHS = [
      '/auth/login',
      '/auth/register',
      '/auth/google',
      '/auth/refresh',
      '/auth/logout',
    ];
    const isAuthRequest = AUTH_PATHS.some((p) => originalRequest._url?.endsWith(p));

    if (error.response?.status !== 401 || originalRequest._retry || isAuthRequest) {
      const apiError: ApiResponse<unknown> = error.response?.data ?? {
        success: false,
        message: error.message || 'An unexpected error occurred',
        errors: [{ field: 'general', message: error.message }],
      };
      const customError = new Error(apiError.message) as Error & {
        response: ApiResponse<unknown>; status: number;
      };
      customError.response = apiError;
      customError.status = error.response?.status ?? 500;
      return Promise.reject(customError);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // El refresh token viaja en la cookie HttpOnly (mismo origen); el body va vacío.
      const refreshResponse = await axios.post<{
        access_token: string;
      }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      const { access_token } = refreshResponse.data;
      tokenStorage.setAccessToken(access_token);
      processQueue(null, access_token);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clearTokens();
      _onLogout?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { apiClient };
export default apiClient;
