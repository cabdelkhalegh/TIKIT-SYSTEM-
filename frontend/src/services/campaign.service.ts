import { apiClient } from '@/lib/api-client';
import type {
  Campaign,
  CampaignListResponse,
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  BudgetStatusResponse,
  CampaignInfluencer,
} from '@/types/campaign.types';

export const campaignService = {
  async getAll(params?: {
    page?: number;
    perPage?: number;
    status?: string;
    clientId?: string;
  }): Promise<CampaignListResponse> {
    const response = await apiClient.get<CampaignListResponse>('/campaigns', { params });
    return response.data;
  },

  async getById(id: string): Promise<CampaignResponse> {
    const response = await apiClient.get<CampaignResponse>(`/campaigns/${id}`);
    return response.data;
  },

  async create(data: CreateCampaignRequest): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>('/campaigns', data);
    return response.data;
  },

  async update(id: string, data: UpdateCampaignRequest): Promise<CampaignResponse> {
    const response = await apiClient.put<CampaignResponse>(`/campaigns/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/campaigns/${id}`);
    return response.data;
  },

  async activate(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`/campaigns/${id}/activate`);
    return response.data;
  },

  async pause(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`/campaigns/${id}/pause`);
    return response.data;
  },

  async resume(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`/campaigns/${id}/resume`);
    return response.data;
  },

  async complete(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`/campaigns/${id}/complete`);
    return response.data;
  },

  async cancel(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`/campaigns/${id}/cancel`);
    return response.data;
  },

  async getBudgetStatus(id: string): Promise<BudgetStatusResponse> {
    const response = await apiClient.get<BudgetStatusResponse>(`/campaigns/${id}/budget`);
    return response.data;
  },

  async getInfluencers(id: string): Promise<{ success: boolean; data: CampaignInfluencer[] }> {
    const response = await apiClient.get<{ success: boolean; data: CampaignInfluencer[] }>(
      `/campaigns/${id}/influencers`
    );
    return response.data;
  },
};
