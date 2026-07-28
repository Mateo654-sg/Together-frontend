import apiClient from '@/config/api';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/api';

export const categoriesApi = {
  async getAll(type?: 'expense' | 'income'): Promise<Category[]> {
    const params = type ? { type } : undefined;
    const response = await apiClient.get<Category[]>('/categories', { params });
    return response.data;
  },
  async getById(id: string): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },
  async create(data: CreateCategoryInput): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  },
  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
