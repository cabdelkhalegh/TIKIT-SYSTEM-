// T088: Client Portal Service — all client-facing API calls
import { apiClient } from '@/lib/api-client';

const BASE = '/client-portal';

export interface ClientDashboardData {
  stats: {
    activeCampaigns: number;
    pendingApprovals: number;
    contractedCreators: number;
    reportsReady: number;
    totalReach: number;
  };
  consolidatedKpis: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    totalClicks: number;
  };
  recentActivity: Array<{
    type: string;
    campaignName: string;
    message: string;
    createdAt: string;
  }>;
}

export interface ClientCampaignSummary {
  id: string;
  displayId: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  influencerCount: number;
  pendingApprovals: number;
  kpiSummary: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
  };
}

export interface ClientCampaignInfluencer {
  id: string;
  handle: string;
  displayName: string;
  platform: string;
  followers: number | null;
  profileImageUrl: string | null;
  aiScore: number | null;
  status: string;
  agreedCost: number | null;
  content: Array<{
    id: string;
    type: string;
    approvalStatus: string;
    fileName: string | null;
    fileUrl: string | null;
    clientFeedback: string | null;
    createdAt: string;
  }>;
  kpis: {
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
  };
}

export interface ClientCampaignDetail {
  id: string;
  displayId: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number | null;
  influencers: ClientCampaignInfluencer[];
  shortlistApproval: {
    id: string;
    status: string;
    approvedBy: string | null;
    rejectedBy: string | null;
    reason: string | null;
  } | null;
  report: {
    id: string;
    status: string;
    kpiSummary: string | null;
    highlights: string | null;
    aiNarrative: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
  } | null;
  kpiSummary: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    totalClicks: number;
  };
}

class ClientPortalService {
  async getDashboard() {
    const response = await apiClient.get<{ success: boolean; data: ClientDashboardData }>(
      `${BASE}/dashboard`
    );
    return response.data;
  }

  async getCampaigns(params?: { status?: string }) {
    const response = await apiClient.get<{ success: boolean; data: { campaigns: ClientCampaignSummary[]; count: number } }>(
      `${BASE}/campaigns`,
      { params }
    );
    return response.data;
  }

  async getCampaign(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: ClientCampaignDetail }>(
      `${BASE}/campaigns/${campaignId}`
    );
    return response.data;
  }

  async approveShortlist(campaignId: string, feedback?: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/shortlist/approve`,
      { feedback }
    );
    return response.data;
  }

  async rejectShortlist(campaignId: string, reason: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/shortlist/reject`,
      { reason }
    );
    return response.data;
  }

  async approveContent(campaignId: string, contentId: string, feedback?: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/content/${contentId}/approve`,
      { feedback }
    );
    return response.data;
  }

  async requestContentChanges(campaignId: string, contentId: string, feedback: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/content/${contentId}/request-changes`,
      { feedback }
    );
    return response.data;
  }

  async approveReport(campaignId: string, feedback?: string) {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/report/approve`,
      { feedback }
    );
    return response.data;
  }

  async getReport(campaignId: string) {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `${BASE}/campaigns/${campaignId}/report`
    );
    return response.data;
  }
}

export const clientPortalService = new ClientPortalService();
