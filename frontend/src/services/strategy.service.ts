// T039: Strategy service — generate, get, update campaign strategy
import { apiClient } from '@/lib/api-client';

export interface Strategy {
  id: string;
  campaignId: string;
  summary: string | null;
  keyMessages: string | null;
  contentPillars: string | null;
  matchingCriteria: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StrategyResponse {
  success: boolean;
  data: Strategy;
  error?: string;
  fallbackRequired?: boolean;
}

function strategyUrl(campaignId: string) {
  return `/campaigns/${campaignId}/strategy`;
}

class StrategyService {
  async generateStrategy(campaignId: string): Promise<StrategyResponse> {
    const response = await apiClient.post<StrategyResponse>(
      `${strategyUrl(campaignId)}/generate`
    );
    return response.data;
  }

  async getStrategy(campaignId: string): Promise<StrategyResponse> {
    const response = await apiClient.get<StrategyResponse>(strategyUrl(campaignId));
    return response.data;
  }

  async updateStrategy(campaignId: string, data: Partial<{
    summary: string;
    keyMessages: string[];
    contentPillars: string[];
    matchingCriteria: Record<string, any>;
  }>): Promise<StrategyResponse> {
    const response = await apiClient.put<StrategyResponse>(strategyUrl(campaignId), data);
    return response.data;
  }
}

export const strategyService = new StrategyService();
