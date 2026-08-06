import apiClient from '@/config/api';
import type { Debt, CoupleBalance } from '@/types/api';

export const debtsApi = {
  async getAll(): Promise<Debt[]> {
    const response = await apiClient.get<Debt[]>('/debts');
    return response.data;
  },
  async pay(id: string): Promise<Debt> {
    const response = await apiClient.post<Debt>(`/debts/${id}/pay`);
    return response.data;
  },
  async getHistory(): Promise<Debt[]> {
    const response = await apiClient.get<Debt[]>('/debts/history');
    return response.data;
  },
  async getBalance(): Promise<CoupleBalance> {
    const response = await apiClient.get<CoupleBalance>('/debts/balance');
    return response.data;
  },
};
