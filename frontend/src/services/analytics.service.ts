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
    return this.transformDashboardData(response.data.data);
  }

  private transformDashboardData(backendData: any): DashboardSummary {
    const totalBudget = backendData.budget.totalBudget || 0;
    const spentBudget = backendData.budget.spentBudget || 0;
    const totalReach = backendData.performance.totalReach || 0;
    const totalEngagement = backendData.performance.totalEngagement || 0;

    // Get collaboration counts by status
    const collaborationsByStatus = backendData.activeCollaborations?.reduce((acc: any, collab: any) => {
      acc[collab.status] = (acc[collab.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      totalCounts: {
        clients: backendData.overview.totalClients,
        campaigns: backendData.overview.totalCampaigns,
        influencers: backendData.overview.totalInfluencers,
        collaborations: backendData.overview.totalCollaborations
      },
      campaignBreakdown: {
        draft: backendData.campaigns.byStatus.draft || 0,
        active: backendData.campaigns.byStatus.active || 0,
        paused: backendData.campaigns.byStatus.paused || 0,
        completed: backendData.campaigns.byStatus.completed || 0,
        cancelled: backendData.campaigns.byStatus.cancelled || 0
      },
      budgetOverview: {
        totalBudget,
        allocatedBudget: backendData.budget.allocatedBudget || 0,
        spentBudget,
        utilizationPercentage: totalBudget > 0 
          ? ((spentBudget / totalBudget) * 100)
          : 0
      },
      performanceMetrics: {
        totalReach,
        totalEngagement,
        totalImpressions: backendData.performance.totalImpressions || 0,
        avgEngagementRate: totalReach > 0 
          ? ((totalEngagement / totalReach) * 100)
          : 0
      },
      activeCollaborations: {
        invited: collaborationsByStatus.invited || 0,
        accepted: collaborationsByStatus.accepted || 0,
        active: collaborationsByStatus.active || 0,
        completed: backendData.performance.completedCollaborations || 0
      },
      recentActivity: (backendData.activeCollaborations || []).slice(0, 5).map((collab: any) => ({
        id: collab.id,
        type: 'collaboration',
        description: `${collab.influencerName} - ${collab.campaignName}`,
        timestamp: collab.startedAt || new Date().toISOString()
      })),
      topPerformers: {
        campaigns: (backendData.topPerformers?.campaigns || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          performance: c.totalEngagement
        })),
        influencers: (backendData.topPerformers?.influencers || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          performance: i.totalEngagement
        }))
      },
      platformDistribution: backendData.platformDistribution || {},
      trends: {
        campaigns: 'N/A',
        collaborations: 'N/A',
        budget: `${Math.round((spentBudget / totalBudget) * 100) || 0}%`
      }
    };
  }

  async getCampaignAnalytics(campaignId: string) {
    const response = await apiClient.get(`/analytics/campaigns/${campaignId}`);
    return response.data.data || response.data;
  }

  async getInfluencerAnalytics(influencerId: string) {
    const response = await apiClient.get(`/analytics/influencers/${influencerId}`);
    return response.data.data || response.data;
  }

  async getCampaignTrends(campaignId: string) {
    const response = await apiClient.get(`/analytics/campaigns/${campaignId}/trends`);
    return response.data.data || response.data;
  }

  async compareCampaigns(campaignIds: string[]) {
    const response = await apiClient.post('/analytics/campaigns/compare', { campaignIds });
    return response.data.data || response.data;
  }

  async exportAnalytics() {
    const response = await apiClient.get('/analytics/export');
    return response.data.data || response.data;
  }
}

export const analyticsService = new AnalyticsService();
