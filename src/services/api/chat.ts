import apiClient from '@/config/api';
import type { ChatMessage, PaginatedList, PaginationParams } from '@/types/api';

export const chatApi = {
  async getAll(params?: PaginationParams & { receiver_id?: string }): Promise<PaginatedList<ChatMessage>> {
    const response = await apiClient.get<PaginatedList<ChatMessage>>('/chat', { params });
    return response.data;
  },
  async send(data: { receiver_id: string; content: string; message_type?: string }): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>('/chat', data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/chat/${id}`);
  },
};
