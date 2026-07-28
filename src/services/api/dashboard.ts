import apiClient from '@/config/api';
import type { Dashboard } from '@/types/api';

export const dashboardApi = {
  async get(): Promise<Dashboard> {
    const response = await apiClient.get<Dashboard>('/dashboard');
    return response.data;
  },
};
