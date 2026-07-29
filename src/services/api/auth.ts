import apiClient, { tokenStorage } from '@/config/api';
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
    if (tokens?.access_token) {
      tokenStorage.setAccessToken(tokens.access_token);
    }
    return tokens;
  },

  async login(input: LoginInput): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: input.email,
      password: input.password,
    });
    const tokens = response.data;
    if (tokens?.access_token) {
      tokenStorage.setAccessToken(tokens.access_token);
    }
    return tokens;
  },

  async refresh(): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {});
    const tokens = response.data;
    if (tokens?.access_token) {
      tokenStorage.setAccessToken(tokens.access_token);
    }
    return tokens;
  },

  async googleLogin(idToken: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/google', { id_token: idToken });
    const tokens = response.data;
    if (tokens?.access_token) {
      tokenStorage.setAccessToken(tokens.access_token);
    }
    return tokens;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      tokenStorage.clearTokens();
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },
};
