// T096: Influencer Portal Service — all influencer-facing API calls
import { apiClient } from '@/lib/api-client';

const BASE = '/influencer-portal';

export interface InfluencerDashboardData {
  stats: {
    activeCampaigns: number;
    briefsToAccept: number;
    pendingReview: number;
    approvedContent: number;
    urgentDeadlines: number;
  };
  upcomingDeadlines: Array<{
    campaignName: string;
    type: string;
    dueDate: string;
  }>;
}

export interface InfluencerCampaignAssignment {
  id: string;
  status: string;
  briefAccepted: boolean;
  briefAcceptedAt: string | null;
  agreedCost: number | null;
  contentSubmitted: number;
  contentApproved: number;
  contentPending: number;
}

export interface InfluencerCampaignSummary {
  id: string;
  displayId: string;
  name: string;
  status: string;
  assignment: InfluencerCampaignAssignment;
  startDate: string | null;
  endDate: string | null;
}

export interface ContentItem {
  id: string;
  type: string;
  version: number;
  approvalStatus: string;
  fileName: string | null;
  fileUrl: string | null;
  internalFeedback: string | null;
  clientFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InfluencerCampaignDetail {
  id: string;
  displayId: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  assignment: {
    id: string;
    status: string;
    briefAccepted: boolean;
    briefAcceptedAt: string | null;
    agreedCost: number | null;
    agreedDeliverables: string | null;
  };
  brief: {
    objectives: string | null;
    deliverables: string | null;
    keyMessages: string | null;
    targetAudience: string | null;
  } | null;
  content: ContentItem[];
  payments: Array<{
    id: string;
    invoiceType: string;
    status: string;
    amount: number | null;
    createdAt: string;
  }>;
}

class InfluencerPortalService {
  async getDashboard() {
    const response = await apiClient.get<{ success: boolean; data: InfluencerDashboardData }>(
      `${BASE}/dashboard`
    );
    return response.data;
  }

  async getCampaigns() {
    const response = await apiClient.get<{ success: boolean; data: { campaigns: InfluencerCampaignSummary[]; count: number } }>(
      `${BASE}/campaigns`
    );
    return response.data;
  }

  async getCampaign(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: InfluencerCampaignDetail }>(
      `${BASE}/campaigns/${campaignId}`
    );
    return response.data;
  }

  async acceptBrief(campaignId: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/brief/accept`,
      {}
    );
    return response.data;
  }

  async submitContent(campaignId: string, file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/content`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async getContent(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: { content: ContentItem[]; count: number } }>(
      `${BASE}/campaigns/${campaignId}/content`
    );
    return response.data;
  }

  async requestDeliverableAdjustment(campaignId: string, data: {
    adjustmentType: 'timeline' | 'rate';
    currentValue?: string;
    requestedValue: string;
    reason: string;
  }) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/deliverable-adjustment`,
      data
    );
    return response.data;
  }
}

export const influencerPortalService = new InfluencerPortalService();
