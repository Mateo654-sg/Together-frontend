import apiClient from '@/config/api';
import type { Budget, CreateBudgetInput, PaginatedList, PaginationParams, BudgetAlert } from '@/types/api';

export const budgetsApi = {
  async getAll(params?: PaginationParams & { month?: number; year?: number; category_id?: string }): Promise<PaginatedList<Budget>> {
    const response = await apiClient.get<PaginatedList<Budget>>('/budgets', { params });
    return response.data;
  },
  async getById(id: string): Promise<Budget> {
    const response = await apiClient.get<Budget>(`/budgets/${id}`);
    return response.data;
  },
  async create(data: CreateBudgetInput): Promise<Budget> {
    const response = await apiClient.post<Budget>('/budgets', data);
    return response.data;
  },
  async update(id: string, data: Partial<CreateBudgetInput>): Promise<Budget> {
    const response = await apiClient.put<Budget>(`/budgets/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/budgets/${id}`);
  },
  async getAlerts(): Promise<PaginatedList<BudgetAlert>> {
    const response = await apiClient.get<PaginatedList<BudgetAlert>>('/budgets/alerts');
    return response.data;
  },
};
