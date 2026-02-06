const { PrismaClient } = require('@prisma/client');
const prismaClient = new PrismaClient();

/**
 * Analytics Engine for Campaign Performance Analysis
 */
class CampaignAnalyticsEngine {
  /**
   * Generate comprehensive campaign analytics
   */
  static async generateCampaignAnalytics(campaignIdentifier) {
    const campaignData = await prismaClient.campaign.findUnique({
      where: { id: campaignIdentifier },
      include: {
        client: true,
        collaborations: {
          include: {
            influencer: true
          }
        }
      }
    });

    if (!campaignData) {
      return null;
    }

    // Budget Analysis
    const budgetMetrics = {
      totalBudget: campaignData.totalBudget || 0,
      allocatedBudget: campaignData.allocatedBudget || 0,
      spentBudget: campaignData.spentBudget || 0,
      remainingBudget: (campaignData.totalBudget || 0) - (campaignData.spentBudget || 0),
      utilizationRate: campaignData.totalBudget > 0 
        ? ((campaignData.spentBudget || 0) / campaignData.totalBudget * 100).toFixed(2)
        : 0
    };

    // Collaboration Metrics
    const activeCollabs = campaignData.collaborations.filter(c => c.status === 'active');
    const completedCollabs = campaignData.collaborations.filter(c => c.status === 'completed');
    const invitedCollabs = campaignData.collaborations.filter(c => c.status === 'invited');
    const acceptedCollabs = campaignData.collaborations.filter(c => ['accepted', 'active', 'completed'].includes(c.status));

    const collaborationMetrics = {
      totalCollaborations: campaignData.collaborations.length,
      byStatus: {
        invited: invitedCollabs.length,
        accepted: campaignData.collaborations.filter(c => c.status === 'accepted').length,
        active: activeCollabs.length,
        completed: completedCollabs.length,
        declined: campaignData.collaborations.filter(c => c.status === 'declined').length,
        cancelled: campaignData.collaborations.filter(c => c.status === 'cancelled').length
      },
      acceptanceRate: invitedCollabs.length > 0 
        ? (acceptedCollabs.length / invitedCollabs.length * 100).toFixed(2)
        : 0,
      completionRate: acceptedCollabs.length > 0
        ? (completedCollabs.length / acceptedCollabs.length * 100).toFixed(2)
        : 0
    };

    // Performance Aggregation
    let aggregatedReach = 0;
    let aggregatedEngagement = 0;
    let aggregatedImpressions = 0;
    let aggregatedLikes = 0;
    let aggregatedComments = 0;
    let aggregatedShares = 0;

    completedCollabs.forEach(collab => {
      const perfData = collab.performanceMetrics || {};
      aggregatedReach += perfData.reach || 0;
      aggregatedEngagement += perfData.engagement || 0;
      aggregatedImpressions += perfData.impressions || 0;
      aggregatedLikes += perfData.likes || 0;
      aggregatedComments += perfData.comments || 0;
      aggregatedShares += perfData.shares || 0;
    });

    const performanceMetrics = {
      totalReach: aggregatedReach,
      totalEngagement: aggregatedEngagement,
      totalImpressions: aggregatedImpressions,
      totalLikes: aggregatedLikes,
      totalComments: aggregatedComments,
      totalShares: aggregatedShares,
      averageEngagementRate: completedCollabs.length > 0 
        ? (aggregatedEngagement / completedCollabs.length).toFixed(2)
        : 0
    };

    // ROI Calculation
    const costPerEngagement = aggregatedEngagement > 0 
      ? ((campaignData.spentBudget || 0) / aggregatedEngagement).toFixed(2)
      : 0;
    
    const estimatedReachValue = aggregatedReach * 0.05; // $0.05 per reach (industry avg)
    const returnOnInvestment = campaignData.spentBudget > 0
      ? ((estimatedReachValue - campaignData.spentBudget) / campaignData.spentBudget * 100).toFixed(2)
      : 0;

    const roiMetrics = {
      costPerEngagement: parseFloat(costPerEngagement),
      estimatedReachValue: parseFloat(estimatedReachValue.toFixed(2)),
      returnOnInvestment: parseFloat(returnOnInvestment),
      budgetEfficiency: campaignData.totalBudget > 0
        ? ((aggregatedReach / campaignData.totalBudget) * 100).toFixed(2)
        : 0
    };

    // Timeline Analysis
    const timelineData = {
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      launchDate: campaignData.launchDate,
      status: campaignData.status,
      durationDays: campaignData.startDate && campaignData.endDate
        ? Math.ceil((new Date(campaignData.endDate) - new Date(campaignData.startDate)) / (1000 * 60 * 60 * 24))
        : null
    };

    // Top Performers
    const sortedCollabs = [...completedCollabs].sort((a, b) => {
      const aEng = (a.performanceMetrics?.engagement || 0);
      const bEng = (b.performanceMetrics?.engagement || 0);
      return bEng - aEng;
    });

    const topPerformers = sortedCollabs.slice(0, 5).map(c => ({
      influencerId: c.influencerId,
      influencerName: c.influencer.fullName,
      engagement: c.performanceMetrics?.engagement || 0,
      reach: c.performanceMetrics?.reach || 0,
      role: c.role
    }));

    // Health Score (0-100)
    let healthScore = 0;
    if (budgetMetrics.utilizationRate > 0 && budgetMetrics.utilizationRate <= 100) healthScore += 20;
    if (collaborationMetrics.acceptanceRate >= 50) healthScore += 20;
    if (collaborationMetrics.completionRate >= 70) healthScore += 20;
    if (performanceMetrics.totalEngagement > 0) healthScore += 20;
    if (campaignData.status === 'active') healthScore += 20;

    return {
      campaignId: campaignData.id,
      campaignName: campaignData.name,
      clientName: campaignData.client.companyLegalName,
      status: campaignData.status,
      budget: budgetMetrics,
      collaborations: collaborationMetrics,
      performance: performanceMetrics,
      roi: roiMetrics,
      timeline: timelineData,
      topPerformers,
      healthScore,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate performance trends over time
   */
  static async generateCampaignTrends(campaignIdentifier, periodDays = 30) {
    const campaignData = await prismaClient.campaign.findUnique({
      where: { id: campaignIdentifier },
      include: {
        collaborations: {
          include: {
            influencer: true
          },
          orderBy: {
            acceptedAt: 'asc'
          }
        }
      }
    });

    if (!campaignData) {
      return null;
    }

    const currentDate = new Date();
    const startPeriod = new Date(currentDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    // Group collaborations by acceptance date
    const dailyMetrics = {};
    
    campaignData.collaborations
      .filter(c => c.acceptedAt && new Date(c.acceptedAt) >= startPeriod)
      .forEach(collab => {
        const dateKey = new Date(collab.acceptedAt).toISOString().split('T')[0];
        
        if (!dailyMetrics[dateKey]) {
          dailyMetrics[dateKey] = {
            date: dateKey,
            collaborationsAccepted: 0,
            collaborationsCompleted: 0,
            totalEngagement: 0,
            totalReach: 0,
            spentAmount: 0
          };
        }
        
        dailyMetrics[dateKey].collaborationsAccepted += 1;
        
        if (collab.status === 'completed') {
          dailyMetrics[dateKey].collaborationsCompleted += 1;
          dailyMetrics[dateKey].totalEngagement += collab.performanceMetrics?.engagement || 0;
          dailyMetrics[dateKey].totalReach += collab.performanceMetrics?.reach || 0;
          dailyMetrics[dateKey].spentAmount += collab.agreedAmount || 0;
        }
      });

    const trendsArray = Object.values(dailyMetrics).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return {
      campaignId: campaignData.id,
      campaignName: campaignData.name,
      periodDays,
      startDate: startPeriod.toISOString(),
      endDate: currentDate.toISOString(),
      trends: trendsArray,
      summary: {
        totalDataPoints: trendsArray.length,
        totalCollaborationsInPeriod: trendsArray.reduce((sum, d) => sum + d.collaborationsAccepted, 0),
        totalEngagementInPeriod: trendsArray.reduce((sum, d) => sum + d.totalEngagement, 0),
        totalReachInPeriod: trendsArray.reduce((sum, d) => sum + d.totalReach, 0),
        totalSpentInPeriod: trendsArray.reduce((sum, d) => sum + d.spentAmount, 0)
      }
    };
  }

  /**
   * Compare multiple campaigns
   */
  static async compareCampaigns(campaignIdentifiers) {
    const campaignAnalytics = await Promise.all(
      campaignIdentifiers.map(id => this.generateCampaignAnalytics(id))
    );

    const validAnalytics = campaignAnalytics.filter(a => a !== null);

    if (validAnalytics.length === 0) {
      return null;
    }

    const comparisonData = validAnalytics.map(analytics => ({
      campaignId: analytics.campaignId,
      campaignName: analytics.campaignName,
      status: analytics.status,
      totalBudget: analytics.budget.totalBudget,
      spentBudget: analytics.budget.spentBudget,
      utilizationRate: parseFloat(analytics.budget.utilizationRate),
      totalCollaborations: analytics.collaborations.totalCollaborations,
      completedCollaborations: analytics.collaborations.byStatus.completed,
      totalEngagement: analytics.performance.totalEngagement,
      totalReach: analytics.performance.totalReach,
      roi: parseFloat(analytics.roi.returnOnInvestment),
      costPerEngagement: analytics.roi.costPerEngagement,
      healthScore: analytics.healthScore
    }));

    // Find best performer
    const bestROI = [...comparisonData].sort((a, b) => b.roi - a.roi)[0];
    const bestEngagement = [...comparisonData].sort((a, b) => b.totalEngagement - a.totalEngagement)[0];
    const mostEfficient = [...comparisonData].sort((a, b) => a.costPerEngagement - b.costPerEngagement)[0];

    return {
      campaigns: comparisonData,
      bestPerformers: {
        highestROI: {
          campaignId: bestROI.campaignId,
          campaignName: bestROI.campaignName,
          roi: bestROI.roi
        },
        highestEngagement: {
          campaignId: bestEngagement.campaignId,
          campaignName: bestEngagement.campaignName,
          engagement: bestEngagement.totalEngagement
        },
        mostCostEfficient: {
          campaignId: mostEfficient.campaignId,
          campaignName: mostEfficient.campaignName,
          costPerEngagement: mostEfficient.costPerEngagement
        }
      },
      comparisonDate: new Date().toISOString()
    };
  }
}

/**
 * Analytics Engine for Influencer Performance Analysis
 */
class InfluencerAnalyticsEngine {
  /**
   * Generate comprehensive influencer analytics
   */
  static async generateInfluencerAnalytics(influencerIdentifier) {
    const influencerData = await prismaClient.influencer.findUnique({
      where: { id: influencerIdentifier },
      include: {
        campaigns: {
          include: {
            campaign: {
              include: {
                client: true
              }
            }
          }
        }
      }
    });

    if (!influencerData) {
      return null;
    }

    // Campaign History
    const totalCampaigns = influencerData.campaigns.length;
    const completedCampaigns = influencerData.campaigns.filter(c => c.status === 'completed');
    const activeCampaigns = influencerData.campaigns.filter(c => c.status === 'active');

    const campaignMetrics = {
      totalCampaigns,
      completedCampaigns: completedCampaigns.length,
      activeCampaigns: activeCampaigns.length,
      successRate: totalCampaigns > 0 
        ? (completedCampaigns.length / totalCampaigns * 100).toFixed(2)
        : 0
    };

    // Performance Aggregation
    let totalEarnings = 0;
    let totalPending = 0;
    let totalPaid = 0;
    let totalEngagement = 0;
    let totalReach = 0;
    let totalImpressions = 0;

    influencerData.campaigns.forEach(collab => {
      const amount = collab.agreedAmount || 0;
      totalEarnings += amount;
      
      if (collab.paymentStatus === 'paid') {
        totalPaid += amount;
      } else if (collab.paymentStatus === 'pending' || collab.paymentStatus === 'partial') {
        totalPending += amount;
      }

      if (collab.performanceMetrics) {
        totalEngagement += collab.performanceMetrics.engagement || 0;
        totalReach += collab.performanceMetrics.reach || 0;
        totalImpressions += collab.performanceMetrics.impressions || 0;
      }
    });

    const earningsMetrics = {
      totalEarnings,
      totalPaid,
      totalPending,
      outstandingBalance: totalEarnings - totalPaid,
      averagePerCampaign: totalCampaigns > 0 ? (totalEarnings / totalCampaigns).toFixed(2) : 0
    };

    const performanceMetrics = {
      totalEngagement,
      totalReach,
      totalImpressions,
      averageEngagement: completedCampaigns.length > 0 
        ? (totalEngagement / completedCampaigns.length).toFixed(0)
        : 0,
      averageReach: completedCampaigns.length > 0
        ? (totalReach / completedCampaigns.length).toFixed(0)
        : 0,
      overallEngagementRate: totalReach > 0
        ? ((totalEngagement / totalReach) * 100).toFixed(2)
        : 0
    };

    // Platform Analysis
    const platformData = influencerData.socialMediaHandles || {};
    const platforms = Object.keys(platformData);
    const audienceMetrics = influencerData.audienceMetrics || {};

    const platformMetrics = {
      activePlatforms: platforms,
      platformCount: platforms.length,
      audienceByPlatform: audienceMetrics
    };

    // Top Campaigns
    const topCampaigns = [...completedCampaigns]
      .sort((a, b) => {
        const aEng = a.performanceMetrics?.engagement || 0;
        const bEng = b.performanceMetrics?.engagement || 0;
        return bEng - aEng;
      })
      .slice(0, 5)
      .map(c => ({
        campaignId: c.campaignId,
        campaignName: c.campaign.name,
        clientName: c.campaign.client.companyLegalName,
        engagement: c.performanceMetrics?.engagement || 0,
        reach: c.performanceMetrics?.reach || 0,
        earnings: c.agreedAmount
      }));

    // Reliability Score
    let reliabilityScore = 0;
    if (campaignMetrics.successRate >= 80) reliabilityScore += 25;
    else if (campaignMetrics.successRate >= 60) reliabilityScore += 15;
    
    if (influencerData.verified) reliabilityScore += 25;
    if (influencerData.qualityScore >= 80) reliabilityScore += 25;
    else if (influencerData.qualityScore >= 60) reliabilityScore += 15;
    
    if (totalCampaigns >= 10) reliabilityScore += 25;
    else if (totalCampaigns >= 5) reliabilityScore += 15;

    return {
      influencerId: influencerData.id,
      influencerName: influencerData.fullName,
      verified: influencerData.verified,
      qualityScore: influencerData.qualityScore,
      availabilityStatus: influencerData.availabilityStatus,
      campaigns: campaignMetrics,
      earnings: earningsMetrics,
      performance: performanceMetrics,
      platforms: platformMetrics,
      topCampaigns,
      reliabilityScore,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate influencer performance trends
   */
  static async generateInfluencerTrends(influencerIdentifier) {
    const influencerData = await prismaClient.influencer.findUnique({
      where: { id: influencerIdentifier },
      include: {
        campaigns: {
          include: {
            campaign: true
          },
          orderBy: {
            completedAt: 'asc'
          }
        }
      }
    });

    if (!influencerData) {
      return null;
    }

    const completedCampaigns = influencerData.campaigns
      .filter(c => c.status === 'completed' && c.completedAt)
      .map((c, index) => ({
        campaignId: c.campaignId,
        campaignName: c.campaign.name,
        completedAt: c.completedAt,
        engagement: c.performanceMetrics?.engagement || 0,
        reach: c.performanceMetrics?.reach || 0,
        earnings: c.agreedAmount || 0,
        engagementRate: c.performanceMetrics?.reach > 0
          ? ((c.performanceMetrics.engagement / c.performanceMetrics.reach) * 100).toFixed(2)
          : 0,
        sequenceNumber: index + 1
      }));

    return {
      influencerId: influencerData.id,
      influencerName: influencerData.fullName,
      campaignHistory: completedCampaigns,
      summary: {
        totalCompletedCampaigns: completedCampaigns.length,
        totalEarnings: completedCampaigns.reduce((sum, c) => sum + c.earnings, 0),
        totalEngagement: completedCampaigns.reduce((sum, c) => sum + c.engagement, 0),
        totalReach: completedCampaigns.reduce((sum, c) => sum + c.reach, 0),
        averageEngagementRate: completedCampaigns.length > 0
          ? (completedCampaigns.reduce((sum, c) => sum + parseFloat(c.engagementRate), 0) / completedCampaigns.length).toFixed(2)
          : 0
      }
    };
  }
}

module.exports = {
  CampaignAnalyticsEngine,
  InfluencerAnalyticsEngine
};
