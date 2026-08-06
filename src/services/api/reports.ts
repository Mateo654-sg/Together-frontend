import apiClient from '@/config/api';
import type { Report, GenerateReportInput, PaginatedList, PaginationParams } from '@/types/api';

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
};
