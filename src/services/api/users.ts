import apiClient from '@/config/api';
import type { SessionHistory, UpdateUserInput, User, UserSettings, UserStatistics } from '@/types/api';

export const usersApi = {
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },
  async updateMe(data: UpdateUserInput): Promise<User> {
    const response = await apiClient.put<User>('/users/me', data);
    return response.data;
  },
  async deleteMe(password: string): Promise<void> {
    await apiClient.delete('/users/me', { data: { password } });
  },
  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await apiClient.post('/users/change-password', data);
  },
  async getStatistics(): Promise<UserStatistics> {
    const response = await apiClient.get<UserStatistics>('/users/statistics');
    return response.data;
  },
  async getSettings(): Promise<UserSettings> {
    const response = await apiClient.get<UserSettings>('/users/settings');
    return response.data;
  },
  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const response = await apiClient.put<UserSettings>('/users/settings', data);
    return response.data;
  },
  async updateAvatar(avatarUrl: string): Promise<User> {
    const response = await apiClient.patch<User>('/users/avatar', { avatar_url: avatarUrl });
    return response.data;
  },
  async getSessions(): Promise<SessionHistory> {
    const response = await apiClient.get<SessionHistory>('/users/sessions');
    return response.data;
  },
  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/users/sessions/${sessionId}`);
  },
  async revokeAllSessions(): Promise<void> {
    await apiClient.post('/users/sessions/revoke-all');
  },
  async exportData(): Promise<{ blob: Blob; filename: string }> {
    const response = await apiClient.get<Blob>('/users/export', { responseType: 'blob' });
    const disposition = response.headers['content-disposition'] ?? '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    return {
      blob: response.data,
      filename: match?.[1] ?? `together-data-${new Date().toISOString().split('T')[0]}.zip`,
    };
  },
};
