import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth (in a real app, extract from JWT)
    // For now, we'll get the first user or use a default
    
    // Get total counts
    const [totalClients, totalCampaigns, totalInfluencers, totalCollaborations] = await Promise.all([
      prisma.client.count(),
      prisma.campaign.count(),
      prisma.influencer.count(),
      prisma.collaboration.count(),
    ]);

    // Get campaign breakdown by status
    const campaigns = await prisma.campaign.groupBy({
      by: ['status'],
      _count: true,
    });

    const campaignBreakdown = {
      draft: 0,
      active: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
    };

    campaigns.forEach((c) => {
      const status = c.status.toLowerCase();
      if (status in campaignBreakdown) {
        campaignBreakdown[status as keyof typeof campaignBreakdown] = c._count;
      }
    });

    // Get budget overview
    const allCampaigns = await prisma.campaign.findMany({
      select: {
        budget: true,
        spentBudget: true,
      },
    });

    const budgetOverview = {
      totalBudget: allCampaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0),
      allocatedBudget: allCampaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0),
      spentBudget: allCampaigns.reduce((sum, c) => sum + Number(c.spentBudget || 0), 0),
      utilizationPercentage: 0,
    };

    if (budgetOverview.totalBudget > 0) {
      budgetOverview.utilizationPercentage = (budgetOverview.spentBudget / budgetOverview.totalBudget) * 100;
    }

    // Get performance metrics from collaborations
    const collaborations = await prisma.collaboration.findMany({
      select: {
        reach: true,
        engagement: true,
        impressions: true,
      },
    });

    const performanceMetrics = {
      totalReach: collaborations.reduce((sum, c) => sum + Number(c.reach || 0), 0),
      totalEngagement: collaborations.reduce((sum, c) => sum + Number(c.engagement || 0), 0),
      totalImpressions: collaborations.reduce((sum, c) => sum + Number(c.impressions || 0), 0),
      avgEngagementRate: 0,
    };

    if (performanceMetrics.totalReach > 0) {
      performanceMetrics.avgEngagementRate = (performanceMetrics.totalEngagement / performanceMetrics.totalReach) * 100;
    }

    // Get active collaborations breakdown
    const collabsByStatus = await prisma.collaboration.groupBy({
      by: ['status'],
      _count: true,
    });

    const activeCollaborations = {
      invited: 0,
      accepted: 0,
      active: 0,
      completed: 0,
    };

    collabsByStatus.forEach((c) => {
      const status = c.status.toLowerCase();
      if (status in activeCollaborations) {
        activeCollaborations[status as keyof typeof activeCollaborations] = c._count;
      }
    });

    // Get platform distribution from influencers
    const influencers = await prisma.influencer.findMany({
      select: {
        platforms: true,
      },
    });

    const platformDistribution: Record<string, number> = {};
    influencers.forEach((inf) => {
      if (inf.platforms && typeof inf.platforms === 'object') {
        Object.keys(inf.platforms).forEach((platform) => {
          platformDistribution[platform] = (platformDistribution[platform] || 0) + 1;
        });
      }
    });

    // Get recent activity (simplified - using recent campaigns)
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

    const recentActivity = recentCampaigns.map((campaign) => ({
      id: campaign.id,
      type: 'campaign',
      description: `Campaign "${campaign.name}" ${campaign.status.toLowerCase()}`,
      timestamp: campaign.createdAt.toISOString(),
      user: 'System',
    }));

    // Top performers (simplified - top 3 campaigns by budget)
    const topCampaigns = await prisma.campaign.findMany({
      take: 3,
      orderBy: { budget: 'desc' },
      select: {
        id: true,
        name: true,
        budget: true,
      },
    });

    const topPerformers = {
      campaigns: topCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        performance: Number(c.budget || 0),
      })),
      influencers: [], // Can be enhanced later
    };

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
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
