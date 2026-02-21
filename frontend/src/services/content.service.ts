import { apiClient } from '@/lib/api-client';
import { BaseService } from './base.service';

export interface Content {
  id: string;
  type: 'script' | 'draft' | 'final';
  version: number;
  approvalStatus: 'pending' | 'internal_approved' | 'client_approved' | 'rejected';
  internalFeedback: string | null;
  clientFeedback: string | null;
  livePostUrl: string | null;
  fileUrl: string | null;
  description: string | null;
  collaborationId: string;
  collaboration?: {
    id: string;
    campaignId: string;
    influencerId: string;
    collaborationStatus: string;
  };
  createdAt: string;
  updatedAt: string;
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
}

export const contentService = new ContentService();
