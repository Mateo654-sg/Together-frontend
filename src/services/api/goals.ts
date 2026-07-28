import apiClient from '@/config/api';
import type { Goal, CreateGoalInput, GoalContribution, GoalStatistics, PaginatedList, PaginationParams } from '@/types/api';

export const goalsApi = {
  async getAll(params?: PaginationParams): Promise<PaginatedList<Goal>> {
    const response = await apiClient.get<PaginatedList<Goal>>('/goals', { params });
    return response.data;
  },
  async getById(id: string): Promise<Goal> {
    const response = await apiClient.get<Goal>(`/goals/${id}`);
    return response.data;
  },
  async create(data: CreateGoalInput): Promise<Goal> {
    const response = await apiClient.post<Goal>('/goals', data);
    return response.data;
  },
  async update(id: string, data: Partial<CreateGoalInput>): Promise<Goal> {
    const response = await apiClient.put<Goal>(`/goals/${id}`, data);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },
  async contribute(id: string, amount: number, date: string): Promise<GoalContribution> {
    const response = await apiClient.post<GoalContribution>(`/goals/${id}/contributions`, { amount, contribution_date: date });
    return response.data;
  },
  async getContributions(id: string): Promise<GoalContribution[]> {
    const response = await apiClient.get<GoalContribution[]>(`/goals/${id}/contributions`);
    return response.data;
  },
  async getStatistics(): Promise<GoalStatistics> {
    const response = await apiClient.get<GoalStatistics>('/goals/statistics');
    return response.data;
  },
};
