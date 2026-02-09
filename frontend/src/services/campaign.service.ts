import { apiClient } from '@/lib/api-client';
import { BaseService } from './base.service';
import type {
  Campaign,
  CampaignListResponse,
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  BudgetStatusResponse,
  CampaignInfluencer,
} from '@/types/campaign.types';

class CampaignService extends BaseService<Campaign> {
  // Use the factory method to create action methods
  activate = this.createActionMethod<CampaignResponse>('activate');
  pause = this.createActionMethod<CampaignResponse>('pause');
  resume = this.createActionMethod<CampaignResponse>('resume');
  complete = this.createActionMethod<CampaignResponse>('complete');
  cancel = this.createActionMethod<CampaignResponse>('cancel');

  constructor() {
    super('/campaigns');
  }

  // Extend getAll with typed response
  async getAll(params?: {
    page?: number;
    perPage?: number;
    status?: string;
    clientId?: string;
  }): Promise<CampaignListResponse> {
    return super.getAll(params) as Promise<CampaignListResponse>;
  }

  // Extend getById with typed response
  async getById(id: string): Promise<CampaignResponse> {
    return super.getById(id) as Promise<CampaignResponse>;
  }

  // Extend create with typed request/response
  async create(data: CreateCampaignRequest): Promise<CampaignResponse> {
    return super.create(data) as Promise<CampaignResponse>;
  }

  // Extend update with typed request/response
  async update(id: string, data: UpdateCampaignRequest): Promise<CampaignResponse> {
    return super.update(id, data) as Promise<CampaignResponse>;
  }

  async getBudgetStatus(id: string): Promise<BudgetStatusResponse> {
    const response = await apiClient.get<BudgetStatusResponse>(`${this.endpoint}/${id}/budget`);
    return response.data;
  }

  async getInfluencers(id: string): Promise<{ success: boolean; data: CampaignInfluencer[] }> {
    const response = await apiClient.get<{ success: boolean; data: CampaignInfluencer[] }>(
      `${this.endpoint}/${id}/influencers`
    );
    return response.data;
  }
}

export const campaignService = new CampaignService();
