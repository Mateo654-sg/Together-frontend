import apiClient from '@/config/api';
import type {
  CreateTransferInput,
  PaginatedList,
  PaginationParams,
  Transfer,
  UpdateTransferInput,
} from '@/types/api';

export interface TransferFilters extends PaginationParams {
  date_from?: string;
  date_to?: string;
  method?: string;
  min_amount?: number;
  max_amount?: number;
}

export const transfersApi = {
  async getAll(params?: TransferFilters): Promise<PaginatedList<Transfer>> {
    const response = await apiClient.get<PaginatedList<Transfer>>('/transfers', { params });
    return response.data;
  },
  async getById(id: string): Promise<Transfer> {
    const response = await apiClient.get<Transfer>(`/transfers/${id}`);
    return response.data;
  },
  async create(data: CreateTransferInput): Promise<Transfer> {
    const response = await apiClient.post<Transfer>('/transfers', data);
    return response.data;
  },
  async update(id: string, data: UpdateTransferInput): Promise<Transfer> {
    const response = await apiClient.put<Transfer>(`/transfers/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/transfers/${id}`);
  },
};
