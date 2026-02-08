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

// Helper to map backend dashboard response to frontend DashboardSummary
function mapDashboardResponse(raw: Record<string, any>): DashboardSummary {
  const overview = raw.overview || {};
  const campaigns = raw.campaigns?.byStatus || {};
  const budget = raw.budget || {};
  const performance = raw.performance || {};
  const activeCollabs = raw.activeCollaborations || [];
  const topPerformers = raw.topPerformers || { campaigns: [], influencers: [] };

  const totalBudget = budget.totalBudget || 0;
  const spentBudget = budget.spentBudget || 0;

  return {
    totalCounts: {
      clients: overview.totalClients || 0,
      campaigns: overview.totalCampaigns || 0,
      influencers: overview.totalInfluencers || 0,
      collaborations: overview.totalCollaborations || 0,
    },
    campaignBreakdown: {
      draft: campaigns.draft || 0,
      active: campaigns.active || 0,
      paused: campaigns.paused || 0,
      completed: campaigns.completed || 0,
      cancelled: campaigns.cancelled || 0,
    },
    budgetOverview: {
      totalBudget,
      allocatedBudget: budget.allocatedBudget || 0,
      spentBudget,
      utilizationPercentage: totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0,
    },
    performanceMetrics: {
      totalReach: performance.totalReach || 0,
      totalEngagement: performance.totalEngagement || 0,
      totalImpressions: performance.totalImpressions || 0,
      avgEngagementRate: performance.totalReach > 0
        ? Math.round((performance.totalEngagement / performance.totalReach) * 10000) / 100
        : 0,
    },
    activeCollaborations: {
      invited: Array.isArray(activeCollabs)
        ? activeCollabs.filter((c: any) => c.status === 'invited').length
        : 0,
      accepted: Array.isArray(activeCollabs)
        ? activeCollabs.filter((c: any) => c.status === 'accepted').length
        : 0,
      active: Array.isArray(activeCollabs) ? activeCollabs.length : 0,
      completed: performance.completedCollaborations || 0,
    },
    recentActivity: Array.isArray(activeCollabs)
      ? activeCollabs.map((c: any) => ({
          id: c.id,
          type: 'collaboration',
          description: `${c.influencerName} - ${c.campaignName}`,
          timestamp: c.invitedAt || new Date().toISOString(),
        }))
      : [],
    topPerformers: {
      campaigns: (topPerformers.campaigns || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        performance: c.totalEngagement || 0,
      })),
      influencers: (topPerformers.influencers || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        performance: i.totalEngagement || 0,
      })),
    },
    platformDistribution: raw.platformDistribution || {},
    trends: {
      campaigns: 'stable',
      collaborations: 'stable',
      budget: 'stable',
    },
  };
}

class AnalyticsService {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get('/analytics/dashboard');
    const raw = response.data?.data || response.data;
    return mapDashboardResponse(raw);
  }

  async getCampaignAnalytics(campaignId: string) {
    const response = await apiClient.get(`/analytics/campaigns/${campaignId}`);
    return response.data?.data || response.data;
  }

  async getInfluencerAnalytics(influencerId: string) {
    const response = await apiClient.get(`/analytics/influencers/${influencerId}`);
    return response.data?.data || response.data;
  }

  async getCampaignTrends(campaignId: string) {
    const response = await apiClient.get(`/analytics/campaigns/${campaignId}/trends`);
    return response.data?.data || response.data;
  }

  async compareCampaigns(campaignIds: string[]) {
    const response = await apiClient.post('/analytics/campaigns/compare', { campaignIds });
    return response.data?.data || response.data;
  }

  async exportAnalytics() {
    const response = await apiClient.get('/analytics/export');
    return response.data?.data || response.data;
  }
}

export const analyticsService = new AnalyticsService();
