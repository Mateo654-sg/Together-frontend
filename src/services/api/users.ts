import apiClient from '@/config/api';
import type { User, UserSettings } from '@/types/api';

export interface UserStatistics {
  total_expenses: number;
  total_incomes: number;
  current_balance: number;
  active_goals: number;
}

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
};
