import apiClient from '@/config/api';

export const statisticsApi = {
  async getMonthly(month: number, year: number): Promise<Record<string, unknown>> {
    const response = await apiClient.get('/reports/statistics/monthly', { params: { month, year } });
    return response.data;
  },
  async getPersonal(): Promise<Record<string, unknown>> {
    const response = await apiClient.get('/reports/statistics/personal');
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
