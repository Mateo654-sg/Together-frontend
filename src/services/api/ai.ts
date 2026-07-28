import apiClient from '@/config/api';
import type {
  AIChatResponse, AIAnalysis, AIPredictions, AIScore, AISummary,
  AIFinancialHealth, AISimulator, AIHistoryEntry, AIInsight, AIRecommendation,
  PaginatedList, PaginationParams,
} from '@/types/api';

export const aiApi = {
  async chat(question: string): Promise<AIChatResponse> {
    const response = await apiClient.post<AIChatResponse>('/ai/chat', { question });
    return response.data;
  },
  async analyze(data: { analysis_type: string; month?: number; year?: number }): Promise<AIAnalysis> {
    const response = await apiClient.post<AIAnalysis>('/ai/analyze', data);
    return response.data;
  },
  async getPredictions(data: { prediction_type: string; goal_id?: string; months_ahead?: number }): Promise<AIPredictions> {
    const response = await apiClient.post<AIPredictions>('/ai/predictions', data);
    return response.data;
  },
  async getScore(): Promise<AIScore> {
    const response = await apiClient.post<AIScore>('/ai/score');
    return response.data;
  },
  async getInsights(): Promise<{ insights: AIInsight[]; period: string }> {
    const response = await apiClient.get<{ insights: AIInsight[]; period: string }>('/ai/insights');
    return response.data;
  },
  async getRecommendations(): Promise<{ recommendations: AIRecommendation[]; potential_savings: number }> {
    const response = await apiClient.post<{ recommendations: AIRecommendation[]; potential_savings: number }>('/ai/recommendations');
    return response.data;
  },
  async getSummary(data?: { month?: number; year?: number }): Promise<AISummary> {
    const response = await apiClient.post<AISummary>('/ai/monthly-summary', data ?? {});
    return response.data;
  },
  async getFinancialHealth(): Promise<AIFinancialHealth> {
    const response = await apiClient.post<AIFinancialHealth>('/ai/financial-health');
    return response.data;
  },
  async simulate(data: { scenario: string; monthly_amount?: number; months?: number }): Promise<AISimulator> {
    const response = await apiClient.post<AISimulator>('/ai/simulator', data);
    return response.data;
  },
  async getHistory(params?: PaginationParams): Promise<PaginatedList<AIHistoryEntry>> {
    const response = await apiClient.get<PaginatedList<AIHistoryEntry>>('/ai/history', { params });
    return response.data;
  },
};
