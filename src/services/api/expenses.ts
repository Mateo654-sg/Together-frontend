import apiClient from '@/config/api';
import type { Expense, CreateExpenseInput, PaginatedList, PaginationParams } from '@/types/api';

export interface BalanceResponse {
  balance: number;
}

export const expensesApi = {
  async getAll(params?: PaginationParams): Promise<PaginatedList<Expense>> {
    const response = await apiClient.get<PaginatedList<Expense>>('/expenses', { params });
    return response.data;
  },
  async getById(id: string): Promise<Expense> {
    const response = await apiClient.get<Expense>(`/expenses/${id}`);
    return response.data;
  },
  async create(data: CreateExpenseInput): Promise<Expense> {
    const response = await apiClient.post<Expense>('/expenses', data);
    return response.data;
  },
  async update(id: string, data: Partial<CreateExpenseInput>): Promise<Expense> {
    const response = await apiClient.put<Expense>(`/expenses/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  },
  async getBalance(): Promise<BalanceResponse> {
    const response = await apiClient.get<BalanceResponse>('/expenses/balance');
    return response.data;
  },
};
