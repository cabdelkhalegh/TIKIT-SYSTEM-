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
    status?: string;
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
}

export const influencerService = new InfluencerService();
