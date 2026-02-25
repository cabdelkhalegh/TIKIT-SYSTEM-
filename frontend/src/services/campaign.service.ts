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
import type { BriefFields } from '@/lib/brief-extractor';

export interface BriefExtractionResponse {
  success: boolean;
  message?: string;
  data: {
    campaignId: string;
    campaignName: string;
    extraction_method: 'openai' | 'keyword';
    fields: BriefFields;
  };
}

export interface StatusTransitionResponse {
  success: boolean;
  data: {
    id: string;
    previousStatus: string;
    newStatus: string;
    phase: string;
    version: number;
    updatedAt: string;
  };
}

export interface RiskAssessmentResponse {
  success: boolean;
  data: {
    campaignId: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: Array<{ field: string; missing: boolean; points: number }>;
    requiresDirectorOverride: boolean;
    campaign: { id: string; displayId: string; campaignName: string };
  };
}

class CampaignService extends BaseService<Campaign> {
  constructor() {
    super('/campaigns');
  }

  async getAll(params?: {
    page?: number;
    perPage?: number;
    status?: string;
    clientId?: string;
  }): Promise<CampaignListResponse> {
    return super.getAll(params) as Promise<CampaignListResponse>;
  }

  async getById(id: string): Promise<CampaignResponse> {
    return super.getById(id) as Promise<CampaignResponse>;
  }

  async create(data: CreateCampaignRequest): Promise<CampaignResponse> {
    return super.create(data) as Promise<CampaignResponse>;
  }

  async update(id: string, data: UpdateCampaignRequest): Promise<CampaignResponse> {
    return super.update(id, data) as Promise<CampaignResponse>;
  }

  // ── T026: V2 campaign service functions ───────────────────────────────────

  async transitionStatus(
    id: string,
    targetStatus: string,
    overrideReason?: string
  ): Promise<StatusTransitionResponse> {
    const response = await apiClient.post<StatusTransitionResponse>(
      `${this.endpoint}/${id}/status`,
      { targetStatus, overrideReason }
    );
    return response.data;
  }

  async getRisk(id: string): Promise<RiskAssessmentResponse> {
    const response = await apiClient.get<RiskAssessmentResponse>(
      `${this.endpoint}/${id}/risk`
    );
    return response.data;
  }

  async softDelete(id: string): Promise<{ success: boolean; data: { message: string; id: string } }> {
    const response = await apiClient.delete<{ success: boolean; data: { message: string; id: string } }>(
      `${this.endpoint}/${id}`
    );
    return response.data;
  }

  async patchCampaign(
    id: string,
    data: Partial<Campaign>,
    version: number
  ): Promise<CampaignResponse> {
    const response = await apiClient.patch<CampaignResponse>(
      `${this.endpoint}/${id}`,
      { ...data, version }
    );
    return response.data;
  }

  // ── Existing lifecycle methods ────────────────────────────────────────────

  async activate(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`${this.endpoint}/${id}/activate`);
    return response.data;
  }

  async pause(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`${this.endpoint}/${id}/pause`);
    return response.data;
  }

  async resume(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`${this.endpoint}/${id}/resume`);
    return response.data;
  }

  async complete(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`${this.endpoint}/${id}/complete`);
    return response.data;
  }

  async cancel(id: string): Promise<CampaignResponse> {
    const response = await apiClient.post<CampaignResponse>(`${this.endpoint}/${id}/cancel`);
    return response.data;
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

  async extractBrief(id: string, text: string): Promise<BriefExtractionResponse> {
    const response = await apiClient.post<BriefExtractionResponse>(
      `${this.endpoint}/${id}/brief`,
      { text }
    );
    return response.data;
  }

  async extractBriefFromFile(id: string, file: File): Promise<BriefExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BriefExtractionResponse>(
      `${this.endpoint}/${id}/brief`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async applyBrief(id: string, fields: BriefFields): Promise<CampaignResponse> {
    const response = await apiClient.put<CampaignResponse>(
      `${this.endpoint}/${id}/brief`,
      { fields }
    );
    return response.data;
  }
}

export const campaignService = new CampaignService();
