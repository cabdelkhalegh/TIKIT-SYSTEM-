import { apiClient } from '@/lib/api-client';

export interface Brief {
  id: string;
  campaignId: string;
  version: number;
  rawText: string | null;
  fileName: string | null;
  objectives: string | null;
  kpis: string | null;
  targetAudience: string | null;
  keyMessages: string | null;
  contentPillars: string | null;
  matchingCriteria: string | null;
  strategy: string | null;
  aiStatus: 'pending' | 'extracting' | 'extracted' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface BriefListResponse {
  success: boolean;
  data: Brief[];
}

interface BriefResponse {
  success: boolean;
  data: Brief;
  message?: string;
}

function briefsUrl(campaignId: string) {
  return `/campaigns/${campaignId}/briefs`;
}

class BriefService {
  async getBriefs(campaignId: string): Promise<BriefListResponse> {
    const response = await apiClient.get<BriefListResponse>(briefsUrl(campaignId));
    return response.data;
  }

  async createBrief(campaignId: string, data: { rawText: string; fileName?: string }): Promise<BriefResponse> {
    const response = await apiClient.post<BriefResponse>(briefsUrl(campaignId), data);
    return response.data;
  }

  async uploadBrief(campaignId: string, file: File): Promise<BriefResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BriefResponse>(
      `${briefsUrl(campaignId)}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async extractBrief(campaignId: string, briefId: string): Promise<BriefResponse> {
    const response = await apiClient.post<BriefResponse>(
      `${briefsUrl(campaignId)}/${briefId}/extract`
    );
    return response.data;
  }

  async updateBrief(campaignId: string, briefId: string, data: Partial<Brief>): Promise<BriefResponse> {
    const response = await apiClient.put<BriefResponse>(
      `${briefsUrl(campaignId)}/${briefId}`,
      data
    );
    return response.data;
  }

  async deleteBrief(campaignId: string, briefId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(
      `${briefsUrl(campaignId)}/${briefId}`
    );
    return response.data;
  }
}

export const briefService = new BriefService();
