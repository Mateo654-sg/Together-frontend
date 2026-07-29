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


