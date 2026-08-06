import apiClient from '@/config/api';
import type { Tag, CreateTagInput, UpdateTagInput, PaginatedList, PaginationParams } from '@/types/api';

export const tagsApi = {
  async getAll(params?: PaginationParams): Promise<PaginatedList<Tag>> {
    const response = await apiClient.get<PaginatedList<Tag>>('/tags', { params });
    return response.data;
  },
  async create(data: CreateTagInput): Promise<Tag> {
    const response = await apiClient.post<Tag>('/tags', data);
    return response.data;
  },
  async update(id: string, data: UpdateTagInput): Promise<Tag> {
    const response = await apiClient.put<Tag>(`/tags/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tags/${id}`);
  },
};
