import { apiClient } from '@/lib/api-client';
import { BaseService } from './base.service';

export interface Content {
  id: string;
  type: 'script' | 'draft' | 'final';
  version: number;
  approvalStatus: 'pending' | 'internal_approved' | 'client_approved' | 'changes_requested';
  filmingBlocked: boolean;
  postingBlocked: boolean;
  internalFeedback: string | null;
  clientFeedback: string | null;
  livePostUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  description: string | null;
  exceptionType: string | null;
  exceptionApprovedBy: string | null;
  exceptionEvidence: string | null;
  collaborationId: string;
  campaignId: string | null;
  collaboration?: {
    id: string;
    campaignId: string;
    influencerId: string;
    collaborationStatus: string;
  };
  campaign?: {
    campaignId: string;
    displayId: string;
    campaignName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PendingContentItem {
  id: string;
  campaign: { id: string; displayId: string; name: string } | null;
  influencer: { id: string; displayId: string; handle: string } | null;
  type: string;
  versionNumber: number;
  approvalStatus: string;
  fileName: string | null;
  filmingBlocked: boolean;
  postingBlocked: boolean;
  createdAt: string;
}

export interface PendingContentResponse {
  success: boolean;
  data: {
    content: PendingContentItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CreateContentRequest {
  type: 'script' | 'draft' | 'final';
  version?: number;
  description?: string;
  fileUrl?: string;
  collaborationId: string;
}

class ContentService extends BaseService<Content> {
  constructor() {
    super('/content');
  }

  async getByCollaboration(collaborationId: string) {
    const response = await apiClient.get<{ success: boolean; data: Content[] }>(
      `${this.endpoint}?collaborationId=${collaborationId}`
    );
    return response.data;
  }

  // ─── T067: Content Approval Workflow Methods ─────────────────────────────

  async approveInternal(campaignId: string, contentId: string, feedback?: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/content/${contentId}/approve-internal`,
      { feedback }
    );
    return response.data;
  }

  async approveClient(campaignId: string, contentId: string, feedback?: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/content/${contentId}/approve-client`,
      { feedback }
    );
    return response.data;
  }

  async requestChanges(campaignId: string, contentId: string, feedback: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/content/${contentId}/request-changes`,
      { feedback }
    );
    return response.data;
  }

  async requestException(
    campaignId: string,
    contentId: string,
    exceptionType: string,
    evidence: string
  ) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/content/${contentId}/exception`,
      { exceptionType, evidence }
    );
    return response.data;
  }

  async submitLiveUrl(campaignId: string, contentId: string, livePostUrl: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/campaigns/${campaignId}/content/${contentId}/live-url`,
      { livePostUrl }
    );
    return response.data;
  }

  async getPendingContent(params?: {
    page?: number;
    limit?: number;
    type?: string;
    approvalStatus?: string;
  }): Promise<PendingContentResponse> {
    const response = await apiClient.get<PendingContentResponse>(
      '/content/pending',
      { params }
    );
    return response.data;
  }
}

export const contentService = new ContentService();
