import apiClient from '@/config/api';
import type { MonthlyStatistics, PersonalStatistics } from '@/types/api';

export const statisticsApi = {
  async getMonthly(month: number, year: number): Promise<MonthlyStatistics> {
    const response = await apiClient.get<MonthlyStatistics>('/reports/statistics/monthly', { params: { month, year } });
    return response.data;
  },
  async getPersonal(): Promise<PersonalStatistics> {
    const response = await apiClient.get<PersonalStatistics>('/reports/statistics/personal');
    return response.data;
  },
};

export const uploadApi = {
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string }>('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
