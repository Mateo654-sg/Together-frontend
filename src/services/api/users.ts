import apiClient from '@/config/api';
import type { User } from '@/types/api';

export const usersApi = {
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },
  async updateMe(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/users/me', data);
    return response.data;
  },
  async deleteMe(password: string): Promise<void> {
    await apiClient.delete('/users/me', { data: { password } });
  },
  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await apiClient.put('/users/change-password', data);
  },
  async getStatistics(): Promise<Record<string, unknown>> {
    const response = await apiClient.get('/users/statistics');
    return response.data;
  },
};
