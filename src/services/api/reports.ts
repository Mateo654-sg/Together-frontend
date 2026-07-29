import apiClient from '@/config/api';
import type { Report, GenerateReportInput, PaginatedList, PaginationParams, MonthlyStatistics, YearlyStatistics, PersonalStatistics } from '@/types/api';

export const reportsApi = {
  async getAll(params?: PaginationParams): Promise<PaginatedList<Report>> {
    const response = await apiClient.get<PaginatedList<Report>>('/reports', { params });
    return response.data;
  },
  async getById(id: string): Promise<Report> {
    const response = await apiClient.get<Report>(`/reports/${id}`);
    return response.data;
  },
  async create(data: GenerateReportInput): Promise<Report> {
    const response = await apiClient.post<Report>('/reports', data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },
  async getMonthlyStats(month: number, year: number): Promise<MonthlyStatistics> {
    const response = await apiClient.get<MonthlyStatistics>('/reports/statistics/monthly', { params: { month, year } });
    return response.data;
  },
  async getYearlyStats(year: number): Promise<YearlyStatistics> {
    const response = await apiClient.get<YearlyStatistics>('/reports/statistics/yearly', { params: { year } });
    return response.data;
  },
  async getPersonalStats(): Promise<PersonalStatistics> {
    const response = await apiClient.get<PersonalStatistics>('/reports/statistics/personal');
    return response.data;
  },
};
