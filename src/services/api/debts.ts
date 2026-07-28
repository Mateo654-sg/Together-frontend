import apiClient from '@/config/api';
import type { Debt, DebtHistory, PaginatedList } from '@/types/api';

export const debtsApi = {
  async getAll(): Promise<PaginatedList<Debt>> {
    const response = await apiClient.get<PaginatedList<Debt>>('/debts');
    return response.data;
  },
  async pay(id: string): Promise<Debt> {
    const response = await apiClient.post<Debt>(`/debts/${id}/pay`);
    return response.data;
  },
  async getHistory(): Promise<DebtHistory> {
    const response = await apiClient.get<DebtHistory>('/debts/history');
    return response.data;
  },
  async getBalance(): Promise<DebtHistory> {
    const response = await apiClient.get<DebtHistory>('/debts/balance');
    return response.data;
  },
};
