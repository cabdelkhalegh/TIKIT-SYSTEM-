import { apiClient } from '@/lib/api-client';
import { BaseService } from './base.service';
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

class InfluencerService extends BaseService<Influencer> {
  constructor() {
    super('/influencers');
  }

  // Extend getAll with typed response
  async getAll(params?: {
    page?: number;
    perPage?: number;
    platform?: Platform;
    status?: InfluencerStatus;
    verified?: boolean;
    search?: string;
  }): Promise<InfluencerListResponse> {
    return super.getAll(params) as Promise<InfluencerListResponse>;
  }

  // Extend getById with typed response
  async getById(id: string): Promise<InfluencerResponse> {
    return super.getById(id) as Promise<InfluencerResponse>;
  }

  // Extend create with typed request/response
  async create(data: CreateInfluencerRequest): Promise<InfluencerResponse> {
    return super.create(data) as Promise<InfluencerResponse>;
  }

  // Extend update with typed request/response
  async update(id: string, data: UpdateInfluencerRequest): Promise<InfluencerResponse> {
    return super.update(id, data) as Promise<InfluencerResponse>;
  }

  // Custom methods specific to influencers
  async advancedSearch(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
    const response = await apiClient.get<AdvancedSearchResponse>(`${this.endpoint}/search/advanced`, { params });
    return response.data;
  }

  async findMatchesForCampaign(campaignId: string): Promise<CampaignMatchResponse> {
    const response = await apiClient.post<CampaignMatchResponse>(`${this.endpoint}/match/campaign/${campaignId}`);
    return response.data;
  }

  async findSimilar(id: string): Promise<SimilarInfluencersResponse> {
    const response = await apiClient.get<SimilarInfluencersResponse>(`${this.endpoint}/${id}/similar`);
    return response.data;
  }

  async compareBulk(data: CompareInfluencersRequest): Promise<CompareInfluencersResponse> {
    const response = await apiClient.post<CompareInfluencersResponse>(`${this.endpoint}/compare/bulk`, data);
    return response.data;
  }

  // ===== Phase 5 US3: Discovery & Campaign-Influencer Lifecycle =====

  async discoverInfluencers(mode: 'name' | 'username' | 'hashtag', query: string): Promise<any> {
    const response = await apiClient.post(`${this.endpoint}/discover`, { mode, query });
    return response.data;
  }

  async addToCampaign(campaignId: string, data: { influencerId?: string; newInfluencer?: any; estimatedCost?: number }): Promise<any> {
    const response = await apiClient.post(`/campaigns/${campaignId}/influencers`, data);
    return response.data;
  }

  async getCampaignInfluencers(campaignId: string, params?: { status?: string; sortBy?: string; sortOrder?: string }): Promise<any> {
    const response = await apiClient.get(`/campaigns/${campaignId}/influencers`, { params });
    return response.data;
  }

  async transitionInfluencerStatus(campaignId: string, influencerId: string, newStatus: string, extra?: { agreedCost?: number; contractStatus?: string }): Promise<any> {
    const response = await apiClient.patch(`/campaigns/${campaignId}/influencers/${influencerId}/status`, { status: newStatus, ...extra });
    return response.data;
  }

  async setInfluencerPricing(campaignId: string, influencerId: string, pricing: { estimatedCost?: number; agreedCost?: number }): Promise<any> {
    const response = await apiClient.post(`/campaigns/${campaignId}/influencers/${influencerId}/pricing`, pricing);
    return response.data;
  }

  async scoreCampaignInfluencers(campaignId: string, influencerIds?: string[]): Promise<any> {
    const response = await apiClient.post(`/campaigns/${campaignId}/influencers/score`, { influencerIds });
    return response.data;
  }
}

export const influencerService = new InfluencerService();
