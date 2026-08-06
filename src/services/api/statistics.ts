import apiClient from '@/config/api';
import type {
  CategoryStatistics,
  CoupleStatistics,
  MonthlyStatistics,
  PersonalStatistics,
  YearlyStatistics,
} from '@/types/api';

export const statisticsApi = {
  async getMonthly(month?: number, year?: number): Promise<MonthlyStatistics> {
    const response = await apiClient.get<MonthlyStatistics>('/statistics/month', {
      params: { month, year },
    });
    return response.data;
  },
  async getYearly(year?: number): Promise<YearlyStatistics> {
    const response = await apiClient.get<YearlyStatistics>('/statistics/year', {
      params: { year },
    });
    return response.data;
  },
  async getCategory(params: {
    month?: number;
    year?: number;
    type?: 'expense' | 'income';
  }): Promise<CategoryStatistics[]> {
    const response = await apiClient.get<CategoryStatistics[]>('/statistics/category', {
      params,
    });
    return response.data;
  },
  async getCouple(): Promise<CoupleStatistics> {
    const response = await apiClient.get<CoupleStatistics>('/statistics/couple');
    return response.data;
  },
  async getPersonal(): Promise<PersonalStatistics> {
    const response = await apiClient.get<PersonalStatistics>('/statistics/personal');
    return response.data;
  },
};
