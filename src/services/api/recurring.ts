import apiClient from '@/config/api';
import type {
  CreateRecurringTransactionInput,
  PaginatedList,
  PaginationParams,
  ProcessRecurringResponse,
  RecurringTransaction,
  UpdateRecurringTransactionInput,
} from '@/types/api';

export interface RecurringParams extends PaginationParams {
  active?: boolean;
}

export const recurringApi = {
  async getAll(params?: RecurringParams): Promise<PaginatedList<RecurringTransaction>> {
    const response = await apiClient.get<PaginatedList<RecurringTransaction>>('/recurring', { params });
    return response.data;
  },
  async create(data: CreateRecurringTransactionInput): Promise<RecurringTransaction> {
    const response = await apiClient.post<RecurringTransaction>('/recurring', data);
    return response.data;
  },
  async update(id: string, data: UpdateRecurringTransactionInput): Promise<RecurringTransaction> {
    const response = await apiClient.put<RecurringTransaction>(`/recurring/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/recurring/${id}`);
  },
  async processDue(onDate?: string): Promise<ProcessRecurringResponse> {
    const response = await apiClient.post<ProcessRecurringResponse>('/recurring/process', null, {
      params: onDate ? { on_date: onDate } : {},
    });
    return response.data;
  },
};
