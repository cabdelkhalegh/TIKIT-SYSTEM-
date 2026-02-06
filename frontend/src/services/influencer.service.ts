import { apiClient } from '@/lib/api-client';
import type {
  Influencer,
  InfluencerListResponse,
  InfluencerResponse,
  CreateInfluencerRequest,
  UpdateInfluencerRequest,
  AdvancedSearchParams,
  AdvancedSearchResponse,
  CampaignMatchResponse,
  SimilarInfluencersResponse,
  CompareInfluencersRequest,
  CompareInfluencersResponse,
  Platform,
  InfluencerStatus,
} from '@/types/influencer.types';

export const influencerService = {
  async getAll(params?: {
    page?: number;
    perPage?: number;
    platform?: Platform;
    status?: InfluencerStatus;
    verified?: boolean;
    search?: string;
  }): Promise<InfluencerListResponse> {
    const response = await apiClient.get<InfluencerListResponse>('/influencers', { params });
    return response.data;
  },

  async getById(id: string): Promise<InfluencerResponse> {
    const response = await apiClient.get<InfluencerResponse>(`/influencers/${id}`);
    return response.data;
  },

  async create(data: CreateInfluencerRequest): Promise<InfluencerResponse> {
    const response = await apiClient.post<InfluencerResponse>('/influencers', data);
    return response.data;
  },

  async update(id: string, data: UpdateInfluencerRequest): Promise<InfluencerResponse> {
    const response = await apiClient.put<InfluencerResponse>(`/influencers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/influencers/${id}`);
    return response.data;
  },

  async advancedSearch(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
    const response = await apiClient.get<AdvancedSearchResponse>('/influencers/search/advanced', { params });
    return response.data;
  },

  async findMatchesForCampaign(campaignId: string): Promise<CampaignMatchResponse> {
    const response = await apiClient.post<CampaignMatchResponse>(`/influencers/match/campaign/${campaignId}`);
    return response.data;
  },

  async findSimilar(id: string): Promise<SimilarInfluencersResponse> {
    const response = await apiClient.get<SimilarInfluencersResponse>(`/influencers/${id}/similar`);
    return response.data;
  },

  async compareBulk(data: CompareInfluencersRequest): Promise<CompareInfluencersResponse> {
    const response = await apiClient.post<CompareInfluencersResponse>('/influencers/compare/bulk', data);
    return response.data;
  },
};
