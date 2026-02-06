import apiClient from '@/lib/api-client';

export interface DashboardSummary {
  totalCounts: {
    clients: number;
    campaigns: number;
    influencers: number;
    collaborations: number;
  };
  campaignBreakdown: {
    draft: number;
    active: number;
    paused: number;
    completed: number;
    cancelled: number;
  };
  budgetOverview: {
    totalBudget: number;
    allocatedBudget: number;
    spentBudget: number;
    utilizationPercentage: number;
  };
  performanceMetrics: {
    totalReach: number;
    totalEngagement: number;
    totalImpressions: number;
    avgEngagementRate: number;
  };
  activeCollaborations: {
    invited: number;
    accepted: number;
    active: number;
    completed: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
  topPerformers: {
    campaigns: Array<{ id: string; name: string; performance: number }>;
    influencers: Array<{ id: string; name: string; performance: number }>;
  };
  platformDistribution: {
    [platform: string]: number;
  };
  trends: {
    campaigns: string;
    collaborations: string;
    budget: string;
  };
}

class AnalyticsService {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  }

  async getCampaignAnalytics(campaignId: string) {
    const response = await apiClient.get(`/analytics/campaigns/${campaignId}`);
    return response.data;
  }

  async getInfluencerAnalytics(influencerId: string) {
    const response = await apiClient.get(`/analytics/influencers/${influencerId}`);
    return response.data;
  }

  async getCampaignTrends(campaignId: string) {
    const response = await apiClient.get(`/analytics/campaigns/${campaignId}/trends`);
    return response.data;
  }

  async compareCampaigns(campaignIds: string[]) {
    const response = await apiClient.post('/analytics/campaigns/compare', { campaignIds });
    return response.data;
  }

  async exportAnalytics() {
    const response = await apiClient.get('/analytics/export');
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
