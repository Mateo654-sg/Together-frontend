import apiClient from '@/config/api';
import type { Reminder, CreateReminderInput, PaginatedList, PaginationParams } from '@/types/api';

export const remindersApi = {
  async getAll(params?: PaginationParams & { completed?: boolean }): Promise<PaginatedList<Reminder>> {
    const response = await apiClient.get<PaginatedList<Reminder>>('/reminders', { params });
    return response.data;
  },
  async getById(id: string): Promise<Reminder> {
    const response = await apiClient.get<Reminder>(`/reminders/${id}`);
    return response.data;
  },
  async create(data: CreateReminderInput): Promise<Reminder> {
    const response = await apiClient.post<Reminder>('/reminders', data);
    return response.data;
  },
  async update(id: string, data: Partial<CreateReminderInput>): Promise<Reminder> {
    const response = await apiClient.put<Reminder>(`/reminders/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/reminders/${id}`);
  },
  async complete(id: string): Promise<Reminder> {
    const response = await apiClient.patch<Reminder>(`/reminders/${id}/complete`);
    return response.data;
  },
};
