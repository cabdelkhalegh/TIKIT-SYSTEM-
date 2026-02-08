// Influencer Management Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication, requireRole } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const asyncHandler = require('../middleware/async-handler');
const InfluencerMatchingEngine = require('../utils/influencer-matching-engine');

const prisma = new PrismaClient();

// Create base CRUD router with custom filters
const router = createCrudRouter({
  prisma,
  modelName: 'influencer',
  idField: 'influencerId',
  listFilters: {
    platform: 'primaryPlatform',
    status: 'availabilityStatus',
    verified: 'boolean'
  },
  includeRelations: {
    list: {
      campaignInfluencers: {
        include: {
          campaign: {
            select: {
              campaignId: true,
              campaignName: true,
              status: true
            }
          }
        }
      }
    },
    detail: {
      campaignInfluencers: {
        include: {
          campaign: {
            include: {
              client: {
                select: {
                  clientId: true,
                  brandDisplayName: true
                }
              }
            }
          }
        }
      }
    }
  },
  orderBy: { qualityScore: 'desc' }
});

// Apply authentication to all routes
router.use('/', requireAuthentication);

// Apply role-based access control to mutation operations
router.use('/', (req, res, next) => {
  const mutationMethods = ['POST', 'PUT'];
  const deleteMethods = ['DELETE'];
  
  if (mutationMethods.includes(req.method)) {
    return requireRole(['admin', 'influencer_manager'])(req, res, next);
  }
  
  if (deleteMethods.includes(req.method)) {
    return requireRole(['admin'])(req, res, next);
  }
  
  next();
});

// ===== DISCOVERY & MATCHING ENDPOINTS =====

// Advanced influencer search with filters
router.get('/search/advanced', requireAuthentication, async (req, res) => {
  try {
    const {
      platform,
      minFollowers,
      maxFollowers,
      minEngagement,
      maxEngagement,
      category,
      status,
      location,
      verified,
      minQualityScore,
      maxQualityScore,
      limit = 20,
      offset = 0
    } = req.query;

    const whereClause = {};
    
    // Platform filter
    if (platform) {
      whereClause.primaryPlatform = platform;
    }
    
    // Availability status
    if (status) {
      whereClause.availabilityStatus = status;
    }
    
    // Location filter
    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive'
      };
    }
    
    // Verified status
    if (verified !== undefined) {
      whereClause.isVerified = verified === 'true';
    }
    
    // Quality score range
    if (minQualityScore || maxQualityScore) {
      whereClause.qualityScore = {};
      if (minQualityScore) whereClause.qualityScore.gte = parseInt(minQualityScore);
      if (maxQualityScore) whereClause.qualityScore.lte = parseInt(maxQualityScore);
    }

    let influencerResults = await prisma.influencer.findMany({
      where: whereClause,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: {
        qualityScore: 'desc'
      }
    });

    // Post-process filters for JSON fields (followers, engagement, categories)
    if (minFollowers || maxFollowers || minEngagement || maxEngagement || category) {
      influencerResults = influencerResults.filter(inf => {
        // Filter by followers
        if (minFollowers || maxFollowers) {
          const avgFollowers = InfluencerMatchingEngine.getAverageFollowers(inf.audienceMetrics);
          if (minFollowers && avgFollowers < parseInt(minFollowers)) return false;
          if (maxFollowers && avgFollowers > parseInt(maxFollowers)) return false;
        }
        
        // Filter by engagement
        if (minEngagement || maxEngagement) {
          const avgEngagement = InfluencerMatchingEngine.getAverageEngagement(inf.audienceMetrics);
          if (minEngagement && avgEngagement < parseFloat(minEngagement)) return false;
          if (maxEngagement && avgEngagement > parseFloat(maxEngagement)) return false;
        }
        
        // Filter by category
        if (category) {
          if (!inf.contentCategories || !Array.isArray(inf.contentCategories) || !inf.contentCategories.some(cat => 
            cat.toLowerCase().includes(category.toLowerCase())
          )) {
            return false;
          }
        }
        
        return true;
      });
    }

    res.json({
      success: true,
      data: influencerResults,
      count: influencerResults.length,
      filters: req.query
    });
  } catch (err) {
    console.error('Error searching influencers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to search influencers'
    });
  }
});

// Find best matching influencers for a campaign
router.post('/match/campaign/:campaignId', requireAuthentication, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 10 } = req.body;

    // Get campaign details
    const campaignData = await prisma.campaign.findUnique({
      where: { campaignId }
    });

    if (!campaignData) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Get all available influencers
    const availableInfluencers = await prisma.influencer.findMany({
      where: {
        availabilityStatus: 'available'
      }
    });

    // Calculate match scores
    const matchedInfluencers = InfluencerMatchingEngine.findBestMatches(
      availableInfluencers,
      campaignData,
      parseInt(limit)
    );

    res.json({
      success: true,
      campaign: {
        id: campaignData.campaignId,
        name: campaignData.campaignName
      },
      matches: matchedInfluencers.map(inf => ({
        influencer: {
          id: inf.influencerId,
          fullName: inf.fullName,
          primaryPlatform: inf.primaryPlatform,
          isVerified: inf.isVerified,
          qualityScore: inf.qualityScore
        },
        matchScore: inf.matchScore,
        recommendation: inf.recommendation,
        scoreBreakdown: inf.scoreBreakdown
      })),
      count: matchedInfluencers.length
    });
  } catch (err) {
    console.error('Error matching influencers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to match influencers'
    });
  }
});

// Find similar influencers
router.get('/:id/similar', requireAuthentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // Get reference influencer
    const referenceInfluencer = await prisma.influencer.findUnique({
      where: { influencerId: id }
    });

    if (!referenceInfluencer) {
      return res.status(404).json({
        success: false,
        error: 'Influencer not found'
      });
    }

    // Get all other influencers
    const otherInfluencers = await prisma.influencer.findMany({
      where: {
        influencerId: {
          not: id
        }
      }
    });

    // Calculate similarity scores
    const similarInfluencers = otherInfluencers.map(inf => ({
      ...inf,
      similarityScore: InfluencerMatchingEngine.calculateSimilarity(referenceInfluencer, inf)
    }));

    // Sort by similarity and take top results
    similarInfluencers.sort((a, b) => b.similarityScore - a.similarityScore);
    const topSimilar = similarInfluencers.slice(0, parseInt(limit));

    res.json({
      success: true,
      referenceInfluencer: {
        id: referenceInfluencer.influencerId,
        fullName: referenceInfluencer.fullName
      },
      similarInfluencers: topSimilar.map(inf => ({
        id: inf.influencerId,
        fullName: inf.fullName,
        primaryPlatform: inf.primaryPlatform,
        contentCategories: inf.contentCategories,
        similarityScore: inf.similarityScore
      })),
      count: topSimilar.length
    });
  } catch (err) {
    console.error('Error finding similar influencers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to find similar influencers'
    });
  }
});

// Bulk compare influencers
router.post('/compare/bulk', requireAuthentication, async (req, res) => {
  try {
    const { influencerIds } = req.body;

    if (!Array.isArray(influencerIds) || influencerIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least 2 influencer IDs to compare'
      });
    }

    const influencersToCompare = await prisma.influencer.findMany({
      where: {
        influencerId: {
          in: influencerIds
        }
      }
    });

    if (influencersToCompare.length < 2) {
      return res.status(404).json({
        success: false,
        error: 'Not enough influencers found for comparison'
      });
    }

    // Build comparison data
    const comparison = influencersToCompare.map(inf => {
      const avgFollowers = InfluencerMatchingEngine.getAverageFollowers(inf.audienceMetrics);
      const avgEngagement = InfluencerMatchingEngine.getAverageEngagement(inf.audienceMetrics);

      return {
        id: inf.influencerId,
        fullName: inf.fullName,
        primaryPlatform: inf.primaryPlatform,
        averageFollowers: Math.round(avgFollowers),
        averageEngagement: Math.round(avgEngagement * 100) / 100,
        contentCategories: inf.contentCategories,
        ratePerPost: inf.ratePerPost,
        ratePerVideo: inf.ratePerVideo,
        qualityScore: inf.qualityScore,
        isVerified: inf.isVerified,
        availabilityStatus: inf.availabilityStatus
      };
    });

    res.json({
      success: true,
      comparison,
      count: comparison.length
    });
  } catch (err) {
    console.error('Error comparing influencers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to compare influencers'
    });
  }
});

module.exports = router;
