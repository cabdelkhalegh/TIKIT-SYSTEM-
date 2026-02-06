const express = require('express');
const analyticsRouter = express.Router();
const { PrismaClient } = require('@prisma/client');
const { CampaignAnalyticsEngine, InfluencerAnalyticsEngine } = require('../utils/analytics-engine');
const { requireAuthentication } = require('../middleware/access-control');
const { NotFoundError } = require('../utils/error-types');

const prismaClient = new PrismaClient();

/**
 * @route   GET /api/v1/analytics/campaigns/:id
 * @desc    Get detailed analytics for a specific campaign
 * @access  Private
 */
analyticsRouter.get('/campaigns/:id', requireAuthentication, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const analytics = await CampaignAnalyticsEngine.generateCampaignAnalytics(id);
    
    if (!analytics) {
      throw new NotFoundError('Campaign not found');
    }
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/analytics/campaigns/:id/trends
 * @desc    Get performance trends for a campaign
 * @access  Private
 */
analyticsRouter.get('/campaigns/:id/trends', requireAuthentication, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const trends = await CampaignAnalyticsEngine.generateCampaignTrends(id, parseInt(days));
    
    if (!trends) {
      throw new NotFoundError('Campaign not found');
    }
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/analytics/campaigns/compare
 * @desc    Compare multiple campaigns
 * @access  Private
 */
analyticsRouter.post('/campaigns/compare', requireAuthentication, async (req, res, next) => {
  try {
    const { campaignIds } = req.body;
    
    if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'campaignIds must be a non-empty array'
      });
    }
    
    if (campaignIds.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Cannot compare more than 10 campaigns at once'
      });
    }
    
    const comparison = await CampaignAnalyticsEngine.compareCampaigns(campaignIds);
    
    if (!comparison) {
      throw new NotFoundError('No valid campaigns found for comparison');
    }
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/analytics/influencers/:id
 * @desc    Get detailed analytics for a specific influencer
 * @access  Private
 */
analyticsRouter.get('/influencers/:id', requireAuthentication, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const analytics = await InfluencerAnalyticsEngine.generateInfluencerAnalytics(id);
    
    if (!analytics) {
      throw new NotFoundError('Influencer not found');
    }
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/analytics/influencers/:id/trends
 * @desc    Get performance trends for an influencer
 * @access  Private
 */
analyticsRouter.get('/influencers/:id/trends', requireAuthentication, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const trends = await InfluencerAnalyticsEngine.generateInfluencerTrends(id);
    
    if (!trends) {
      throw new NotFoundError('Influencer not found');
    }
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get comprehensive dashboard summary
 * @access  Private
 */
analyticsRouter.get('/dashboard', requireAuthentication, async (req, res, next) => {
  try {
    // Get counts
    const [clientsTotal, campaignsTotal, influencersTotal, collaborationsTotal] = await Promise.all([
      prismaClient.client.count(),
      prismaClient.campaign.count(),
      prismaClient.influencer.count(),
      prismaClient.campaignInfluencer.count()
    ]);

    // Get campaigns by status
    const campaignsByStatus = await prismaClient.campaign.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const statusBreakdown = campaignsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});

    // Get budget overview
    const budgetData = await prismaClient.campaign.aggregate({
      _sum: {
        totalBudget: true,
        allocatedBudget: true,
        spentBudget: true
      }
    });

    // Get performance metrics from completed collaborations
    const completedCollaborations = await prismaClient.campaignInfluencer.findMany({
      where: {
        status: 'completed'
      },
      select: {
        performanceMetrics: true
      }
    });

    let totalReachValue = 0;
    let totalEngagementValue = 0;
    let totalImpressionsValue = 0;

    completedCollaborations.forEach(collab => {
      if (collab.performanceMetrics) {
        totalReachValue += collab.performanceMetrics.reach || 0;
        totalEngagementValue += collab.performanceMetrics.engagement || 0;
        totalImpressionsValue += collab.performanceMetrics.impressions || 0;
      }
    });

    // Get active collaborations
    const activeCollaborations = await prismaClient.campaignInfluencer.findMany({
      where: {
        status: 'active'
      },
      include: {
        campaign: {
          select: {
            name: true
          }
        },
        influencer: {
          select: {
            fullName: true
          }
        }
      },
      take: 10,
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Get top campaigns by engagement
    const topCampaigns = await prismaClient.campaign.findMany({
      where: {
        status: {
          in: ['active', 'completed']
        }
      },
      include: {
        collaborations: {
          where: {
            status: 'completed'
          },
          select: {
            performanceMetrics: true
          }
        }
      },
      take: 100
    });

    const campaignsWithEngagement = topCampaigns.map(campaign => {
      const totalEngagement = campaign.collaborations.reduce((sum, collab) => {
        return sum + (collab.performanceMetrics?.engagement || 0);
      }, 0);
      
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalEngagement
      };
    }).sort((a, b) => b.totalEngagement - a.totalEngagement).slice(0, 5);

    // Get top influencers by performance
    const topInfluencers = await prismaClient.influencer.findMany({
      where: {
        campaigns: {
          some: {
            status: 'completed'
          }
        }
      },
      include: {
        campaigns: {
          where: {
            status: 'completed'
          },
          select: {
            performanceMetrics: true
          }
        }
      },
      take: 100
    });

    const influencersWithEngagement = topInfluencers.map(influencer => {
      const totalEngagement = influencer.campaigns.reduce((sum, campaign) => {
        return sum + (campaign.performanceMetrics?.engagement || 0);
      }, 0);
      
      return {
        id: influencer.id,
        name: influencer.fullName,
        totalEngagement,
        completedCampaigns: influencer.campaigns.length
      };
    }).sort((a, b) => b.totalEngagement - a.totalEngagement).slice(0, 5);

    // Platform distribution
    const allInfluencers = await prismaClient.influencer.findMany({
      select: {
        socialMediaHandles: true
      }
    });

    const platformCounts = {};
    allInfluencers.forEach(inf => {
      if (inf.socialMediaHandles) {
        Object.keys(inf.socialMediaHandles).forEach(platform => {
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
      }
    });

    const dashboardData = {
      overview: {
        totalClients: clientsTotal,
        totalCampaigns: campaignsTotal,
        totalInfluencers: influencersTotal,
        totalCollaborations: collaborationsTotal
      },
      campaigns: {
        byStatus: {
          draft: statusBreakdown.draft || 0,
          active: statusBreakdown.active || 0,
          paused: statusBreakdown.paused || 0,
          completed: statusBreakdown.completed || 0,
          cancelled: statusBreakdown.cancelled || 0
        }
      },
      budget: {
        totalBudget: budgetData._sum.totalBudget || 0,
        allocatedBudget: budgetData._sum.allocatedBudget || 0,
        spentBudget: budgetData._sum.spentBudget || 0,
        remainingBudget: (budgetData._sum.totalBudget || 0) - (budgetData._sum.spentBudget || 0)
      },
      performance: {
        totalReach: totalReachValue,
        totalEngagement: totalEngagementValue,
        totalImpressions: totalImpressionsValue,
        completedCollaborations: completedCollaborations.length
      },
      activeCollaborations: activeCollaborations.map(collab => ({
        id: collab.id,
        campaignName: collab.campaign.name,
        influencerName: collab.influencer.fullName,
        role: collab.role,
        status: collab.status,
        startedAt: collab.startedAt
      })),
      topPerformers: {
        campaigns: campaignsWithEngagement,
        influencers: influencersWithEngagement
      },
      platformDistribution: platformCounts,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/analytics/export
 * @desc    Export all analytics data
 * @access  Private
 */
analyticsRouter.get('/export', requireAuthentication, async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;

    // Get all campaigns
    const campaigns = await prismaClient.campaign.findMany({
      select: { id: true }
    });

    // Get all influencers
    const influencers = await prismaClient.influencer.findMany({
      select: { id: true }
    });

    // Generate analytics for all campaigns (limit to prevent timeout)
    const campaignAnalytics = await Promise.all(
      campaigns.slice(0, 50).map(c => CampaignAnalyticsEngine.generateCampaignAnalytics(c.id))
    );

    // Generate analytics for all influencers (limit to prevent timeout)
    const influencerAnalytics = await Promise.all(
      influencers.slice(0, 50).map(i => InfluencerAnalyticsEngine.generateInfluencerAnalytics(i.id))
    );

    const exportData = {
      campaigns: campaignAnalytics.filter(a => a !== null),
      influencers: influencerAnalytics.filter(a => a !== null),
      exportedAt: new Date().toISOString(),
      totalCampaigns: campaigns.length,
      totalInfluencers: influencers.length,
      note: campaigns.length > 50 || influencers.length > 50 
        ? 'Export limited to first 50 items. Use specific analytics endpoints for complete data.'
        : 'Complete export'
    };

    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Only JSON format is currently supported'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = analyticsRouter;
