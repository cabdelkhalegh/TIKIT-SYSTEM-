// Influencer Management Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const createRoleBasedMethodMiddleware = require('../middleware/role-based-method');
const asyncHandler = require('../middleware/async-handler');
const InfluencerMatchingEngine = require('../utils/influencer-matching-engine');
const instagramService = require('../services/instagram-service');
const { generateInfluencerId } = require('../services/id-generator-service');

const prisma = new PrismaClient();

// Helper: determine profileStatus based on field completeness
function determineProfileStatus(data) {
  const requiredForComplete = ['handle', 'fullName', 'email', 'platform', 'followerCount', 'engagementRate'];
  const hasAll = requiredForComplete.every((f) => data[f] != null && data[f] !== '');
  return hasAll ? 'complete' : 'stub';
}

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

// Apply role-based access control
router.use('/', createRoleBasedMethodMiddleware({
  mutation: ['admin', 'influencer_manager'],
  delete: ['admin']
}));

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

// ===== T045: INSTAGRAM DISCOVERY ENDPOINT =====

// POST /influencers/discover — discover influencers via Instagram
router.post('/discover', requireAuthentication, async (req, res) => {
  try {
    const { mode, query, limit = 20 } = req.body;

    if (!mode || !query) {
      return res.status(400).json({
        success: false,
        error: 'mode and query are required',
      });
    }

    const validModes = ['name', 'username', 'hashtag'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'mode must be one of: name, username, hashtag',
      });
    }

    let searchResult;
    switch (mode) {
      case 'name':
        searchResult = await instagramService.searchByName(query);
        break;
      case 'username':
        searchResult = await instagramService.searchByUsername(query);
        break;
      case 'hashtag':
        searchResult = await instagramService.searchByHashtag(query);
        break;
    }

    // Limit results
    let results = (searchResult.results || []).slice(0, Math.min(parseInt(limit), 50));

    // Check which discovered profiles already exist in our DB
    const usernames = results.map((r) => r.username).filter(Boolean);
    const existingInfluencers = usernames.length
      ? await prisma.influencer.findMany({
          where: {
            handle: { in: usernames.map((u) => `@${u}`) },
          },
          select: { influencerId: true, handle: true },
        })
      : [];

    const existingMap = new Map(
      existingInfluencers.map((inf) => [inf.handle, inf.influencerId])
    );

    results = results.map((r) => ({
      ...r,
      isExisting: existingMap.has(`@${r.username}`),
      existingInfluencerId: existingMap.get(`@${r.username}`) || null,
    }));

    res.json({
      success: true,
      data: {
        results,
        mode,
        query,
        resultCount: results.length,
        isDemoData: searchResult.isDemoData || false,
      },
    });
  } catch (error) {
    console.error('Error discovering influencers:', error);
    if (error.message?.includes('Instagram API')) {
      return res.status(503).json({
        success: false,
        error: 'Instagram API is unavailable. Please try again later.',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to discover influencers',
    });
  }
});

// ===== T046: CREATE INFLUENCER WITH INF-XXXX DISPLAY ID =====

// Override the CRUD create — POST /influencers (with display ID)
router.post('/', requireAuthentication, async (req, res) => {
  try {
    const { handle, displayName, email, phone, platform, niches, geo, city, country,
      language, followerCount, engagementRate, rateCard, tier, gender, bio,
      profileImage, representation, agentContact, tiktokHandle, tiktokLink,
      sociataProfileUrl, profileStatus, fullName } = req.body;

    if (!handle) {
      return res.status(400).json({
        success: false,
        error: 'handle is required',
      });
    }

    // Check for duplicate handle
    const existing = await prisma.influencer.findFirst({
      where: { handle },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Influencer with this handle already exists',
      });
    }

    // Generate INF-XXXX display ID
    const displayId = await generateInfluencerId();

    // Build influencer data
    const influencerData = {
      displayId,
      handle,
      fullName: fullName || displayName || handle,
      displayName: displayName || handle,
      email: email || `${handle.replace('@', '')}@placeholder.tikit`,
      phone: phone || null,
      platform: platform || 'instagram',
      niches: niches ? JSON.stringify(niches) : null,
      geo: geo || null,
      city: city || null,
      country: country || null,
      language: language || null,
      followerCount: followerCount ? parseInt(followerCount) : null,
      engagementRate: engagementRate ? parseFloat(engagementRate) : null,
      rateCard: rateCard ? JSON.stringify(rateCard) : null,
      tier: tier || null,
      gender: gender || null,
      bio: bio || null,
      profileImageUrl: profileImage || null,
      representation: representation || 'direct',
      agentContact: agentContact || null,
      tiktokHandle: tiktokHandle || null,
      tiktokLink: tiktokLink || null,
      sociataProfileUrl: sociataProfileUrl || null,
    };

    // Determine profile status
    influencerData.profileStatus = profileStatus || determineProfileStatus(influencerData);

    const influencer = await prisma.influencer.create({
      data: influencerData,
    });

    res.status(201).json({
      success: true,
      data: {
        id: influencer.influencerId,
        displayId: influencer.displayId,
        handle: influencer.handle,
        profileStatus: influencer.profileStatus,
        createdAt: influencer.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating influencer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create influencer',
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
