import apiClient from '@/config/api';
import type { CoupleInvite, CoupleStatusResponse } from '@/types/api';

export const couplesApi = {
  async invite(): Promise<CoupleInvite> {
    const response = await apiClient.post<CoupleInvite>('/couples/invite');
    return response.data;
  },
  async accept(invitationCode: string): Promise<CoupleInvite> {
    const response = await apiClient.post<CoupleInvite>('/couples/accept', { invitation_code: invitationCode });
    return response.data;
  },
  async reject(invitationCode: string): Promise<void> {
    await apiClient.post('/couples/reject', { invitation_code: invitationCode });
  },
  async getStatus(): Promise<CoupleStatusResponse> {
    const response = await apiClient.get<CoupleStatusResponse>('/couples');
    return response.data;
  },
  async unlink(): Promise<void> {
    await apiClient.delete('/couples/unlink');
  },
};
