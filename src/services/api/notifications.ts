import apiClient from '@/config/api';
import type { Notification, PaginatedList, PaginationParams } from '@/types/api';

export const notificationsApi = {
  async getAll(params?: PaginationParams & { unread_only?: boolean }): Promise<PaginatedList<Notification>> {
    const response = await apiClient.get<PaginatedList<Notification>>('/notifications', { params });
    return response.data;
  },
  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read');
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
