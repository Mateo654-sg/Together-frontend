import apiClient from '@/config/api';
import { tokenStorage } from '@/config/api';
import type { LoginInput, RegisterInput, TokenResponse } from '@/types/api';

export const authApi = {
  async register(input: RegisterInput): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/register', {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      password: input.password,
    });
    const tokens = response.data;
    if (tokens?.access_token && tokens?.refresh_token) {
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    }
    return tokens;
  },

  async login(input: LoginInput): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: input.email,
      password: input.password,
    });
    const tokens = response.data;
    if (tokens?.access_token && tokens?.refresh_token) {
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    }
    return tokens;
  },

  async refresh(): Promise<TokenResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    const tokens = response.data;
    if (tokens?.access_token && tokens?.refresh_token) {
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    }
    return tokens;
  },

  async googleLogin(idToken: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/google', { id_token: idToken });
    const tokens = response.data;
    if (tokens?.access_token && tokens?.refresh_token) {
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    }
    return tokens;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    } finally {
      tokenStorage.clearTokens();
    }
  },
};
