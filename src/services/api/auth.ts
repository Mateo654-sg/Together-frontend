import apiClient, { tokenStorage } from '@/config/api';
import type { LoginInput, RegisterInput, TokenResponse } from '@/types/api';

function storeTokens(tokens: TokenResponse): void {
  if (tokens?.access_token) {
    tokenStorage.setAccessToken(tokens.access_token);
  }
  if (tokens?.refresh_token) {
    tokenStorage.setRefreshToken(tokens.refresh_token);
  }
}

export const authApi = {
  async register(input: RegisterInput): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/register', {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      password: input.password,
    });
    const tokens = response.data;
    storeTokens(tokens);
    return tokens;
  },

  async login(input: LoginInput): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: input.email,
      password: input.password,
    });
    const tokens = response.data;
    storeTokens(tokens);
    return tokens;
  },

  async refresh(): Promise<TokenResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    const response = await apiClient.post<TokenResponse>(
      '/auth/refresh',
      refreshToken ? { refresh_token: refreshToken } : {}
    );
    const tokens = response.data;
    storeTokens(tokens);
    return tokens;
  },

  async googleLogin(idToken: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/google', { id_token: idToken });
    const tokens = response.data;
    storeTokens(tokens);
    return tokens;
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {});
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
