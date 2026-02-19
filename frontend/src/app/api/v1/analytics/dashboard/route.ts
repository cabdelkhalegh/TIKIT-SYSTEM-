import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Return default data structure to ensure endpoint always works
  try {
    // Get total counts with error handling - default to 0 on any error
    let totalClients = 0;
    let totalCampaigns = 0;
    let totalInfluencers = 0;
    let totalCollaborations = 0;

    try {
      const counts = await Promise.all([
        prisma.client.count(),
        prisma.campaign.count(),
        prisma.influencer.count(),
        prisma.collaboration.count(),
      ]);
      [totalClients, totalCampaigns, totalInfluencers, totalCollaborations] = counts;
    } catch (countError) {
      console.error('Error fetching counts:', countError);
      // Continue with zeros
    }

    // Get campaign breakdown by status
    const campaignBreakdown = {
      draft: 0,
      active: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
    };

    try {
      const campaigns = await prisma.campaign.groupBy({
        by: ['status'],
        _count: true,
      });

      campaigns.forEach((c) => {
        const status = c.status.toLowerCase();
        if (status in campaignBreakdown) {
          campaignBreakdown[status as keyof typeof campaignBreakdown] = c._count;
        }
      });
    } catch (err) {
      console.error('Campaign breakdown error:', err);
    }

    // Get budget overview
    const budgetOverview = {
      totalBudget: 0,
      allocatedBudget: 0,
      spentBudget: 0,
      utilizationPercentage: 0,
    };

    try {
      const allCampaigns = await prisma.campaign.findMany({
        select: {
          budget: true,
          spentBudget: true,
        },
      });

      budgetOverview.totalBudget = allCampaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
      budgetOverview.allocatedBudget = budgetOverview.totalBudget;
      budgetOverview.spentBudget = allCampaigns.reduce((sum, c) => sum + Number(c.spentBudget || 0), 0);

      if (budgetOverview.totalBudget > 0) {
        budgetOverview.utilizationPercentage = (budgetOverview.spentBudget / budgetOverview.totalBudget) * 100;
      }
    } catch (err) {
      console.error('Budget overview error:', err);
    }

    // Get performance metrics from collaborations
    const performanceMetrics = {
      totalReach: 0,
      totalEngagement: 0,
      totalImpressions: 0,
      avgEngagementRate: 0,
    };

    try {
      const collaborations = await prisma.collaboration.findMany({
        select: {
          reach: true,
          engagement: true,
          impressions: true,
        },
      });

      performanceMetrics.totalReach = collaborations.reduce((sum, c) => sum + Number(c.reach || 0), 0);
      performanceMetrics.totalEngagement = collaborations.reduce((sum, c) => sum + Number(c.engagement || 0), 0);
      performanceMetrics.totalImpressions = collaborations.reduce((sum, c) => sum + Number(c.impressions || 0), 0);

      if (performanceMetrics.totalReach > 0) {
        performanceMetrics.avgEngagementRate = (performanceMetrics.totalEngagement / performanceMetrics.totalReach) * 100;
      }
    } catch (err) {
      console.error('Performance metrics error:', err);
    }

    // Get active collaborations breakdown
    const activeCollaborations = {
      invited: 0,
      accepted: 0,
      active: 0,
      completed: 0,
    };

    try {
      const collabsByStatus = await prisma.collaboration.groupBy({
        by: ['status'],
        _count: true,
      });

      collabsByStatus.forEach((c) => {
        const status = c.status.toLowerCase();
        if (status in activeCollaborations) {
          activeCollaborations[status as keyof typeof activeCollaborations] = c._count;
        }
      });
    } catch (err) {
      console.error('Active collaborations error:', err);
    }

    // Get platform distribution from influencers
    const platformDistribution: Record<string, number> = {};
    try {
      const influencers = await prisma.influencer.findMany({
        select: {
          platforms: true,
        },
      });

      influencers.forEach((inf) => {
        if (inf.platforms && typeof inf.platforms === 'object') {
          Object.keys(inf.platforms).forEach((platform) => {
            platformDistribution[platform] = (platformDistribution[platform] || 0) + 1;
          });
        }
      });
    } catch (err) {
      console.error('Platform distribution error:', err);
    }

    // Get recent activity (simplified - using recent campaigns)
    let recentActivity: any[] = [];
    try {
      const recentCampaigns = await prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });

      recentActivity = recentCampaigns.map((campaign) => ({
        id: campaign.id,
        type: 'campaign',
        description: `Campaign "${campaign.name}" ${campaign.status.toLowerCase()}`,
        timestamp: campaign.createdAt.toISOString(),
        user: 'System',
      }));
    } catch (err) {
      console.error('Recent activity error:', err);
    }

    // Top performers (simplified - top 3 campaigns by budget)
    const topPerformers = {
      campaigns: [],
      influencers: [],
    };

    try {
      const topCampaigns = await prisma.campaign.findMany({
        take: 3,
        orderBy: { budget: 'desc' },
        select: {
          id: true,
          name: true,
          budget: true,
        },
      });

      topPerformers.campaigns = topCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        performance: Number(c.budget || 0),
      }));
    } catch (err) {
      console.error('Top performers error:', err);
    }

    // Determine trends (simplified - all up for now)
    const trends = {
      campaigns: 'up',
      collaborations: 'up',
      budget: budgetOverview.utilizationPercentage > 50 ? 'up' : 'neutral',
    };

    const summary = {
      totalCounts: {
        clients: totalClients,
        campaigns: totalCampaigns,
        influencers: totalInfluencers,
        collaborations: totalCollaborations,
      },
      campaignBreakdown,
      budgetOverview,
      performanceMetrics,
      activeCollaborations,
      recentActivity,
      topPerformers,
      platformDistribution,
      trends,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    // Return minimal valid structure even on complete failure
    return NextResponse.json({
      totalCounts: { clients: 0, campaigns: 0, influencers: 0, collaborations: 0 },
      campaignBreakdown: { draft: 0, active: 0, paused: 0, completed: 0, cancelled: 0 },
      budgetOverview: { totalBudget: 0, allocatedBudget: 0, spentBudget: 0, utilizationPercentage: 0 },
      performanceMetrics: { totalReach: 0, totalEngagement: 0, totalImpressions: 0, avgEngagementRate: 0 },
      activeCollaborations: { invited: 0, accepted: 0, active: 0, completed: 0 },
      recentActivity: [],
      topPerformers: { campaigns: [], influencers: [] },
      platformDistribution: {},
      trends: { campaigns: 'neutral', collaborations: 'neutral', budget: 'neutral' },
    });
  }
}
