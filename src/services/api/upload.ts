import apiClient from '@/config/api';

export const uploadApi = {
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  async uploadAvatar(file: File): Promise<{ url: string }> {
    return this.uploadImage(file);
  },
  async uploadExpenseAttachment(file: File): Promise<{ url: string }> {
    return this.uploadImage(file);
  },
};
