import apiClient from '@/config/api';
import type { SharedExpense, SharedIncome, CreateSharedExpenseInput, PaginatedList, PaginationParams } from '@/types/api';

export const sharedExpensesApi = {
  async getAll(params?: PaginationParams & { category_id?: string; date_from?: string; date_to?: string }): Promise<PaginatedList<SharedExpense>> {
    const response = await apiClient.get<PaginatedList<SharedExpense>>('/shared-expenses', { params });
    return response.data;
  },
  async getById(id: string): Promise<SharedExpense> {
    const response = await apiClient.get<SharedExpense>(`/shared-expenses/${id}`);
    return response.data;
  },
  async create(data: CreateSharedExpenseInput): Promise<SharedExpense> {
    const response = await apiClient.post<SharedExpense>('/shared-expenses', data);
    return response.data;
  },
  async update(id: string, data: Partial<CreateSharedExpenseInput>): Promise<SharedExpense> {
    const response = await apiClient.put<SharedExpense>(`/shared-expenses/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/shared-expenses/${id}`);
  },
  async getAllIncomes(params?: PaginationParams & { category_id?: string; date_from?: string; date_to?: string }): Promise<PaginatedList<SharedIncome>> {
    const response = await apiClient.get<PaginatedList<SharedIncome>>('/shared-incomes', { params });
    return response.data;
  },
  async createIncome(data: Omit<SharedIncome, 'id' | 'created_at'>): Promise<SharedIncome> {
    const response = await apiClient.post<SharedIncome>('/shared-incomes', data);
    return response.data;
  },
};
