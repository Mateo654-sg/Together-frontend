import apiClient from '@/config/api';
import type { Income, CreateIncomeInput, PaginatedList, PaginationParams } from '@/types/api';

export const incomesApi = {
  async getAll(params?: PaginationParams): Promise<PaginatedList<Income>> {
    const response = await apiClient.get<PaginatedList<Income>>('/incomes', { params });
    return response.data;
  },
  async getById(id: string): Promise<Income> {
    const response = await apiClient.get<Income>(`/incomes/${id}`);
    return response.data;
  },
  async create(data: CreateIncomeInput): Promise<Income> {
    const response = await apiClient.post<Income>('/incomes', data);
    return response.data;
  },
  async update(id: string, data: Partial<CreateIncomeInput>): Promise<Income> {
    const response = await apiClient.put<Income>(`/incomes/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/incomes/${id}`);
  },
};
