// TIKIT Backend API Server
// Main entry point for the backend application

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Import authentication routes
const authRoutes = require('./routes/auth-routes');

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes (public)
app.use('/api/v1/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TIKIT Backend API',
    timestamp: new Date().toISOString(),
    version: '0.3.1'
  });
});

// API v1 routes - Clients
app.get('/api/v1/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        campaigns: {
          select: {
            campaignId: true,
            campaignName: true,
            status: true
          }
        }
      }
    });
    res.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
});

app.get('/api/v1/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { clientId: req.params.id },
      include: {
        campaigns: true
      }
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client'
    });
  }
});

// API v1 routes - Campaigns
app.get('/api/v1/campaigns', async (req, res) => {
  try {
    const { status, clientId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        client: {
          select: {
            clientId: true,
            brandDisplayName: true,
            legalCompanyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

app.get('/api/v1/campaigns/:id', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: req.params.id },
      include: {
        client: true
      }
    });
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

app.post('/api/v1/campaigns', async (req, res) => {
  try {
    const campaign = await prisma.campaign.create({
      data: req.body,
      include: {
        client: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
});

// API v1 routes - Influencers
app.get('/api/v1/influencers', async (req, res) => {
  try {
    const { platform, status, verified } = req.query;
    
    const where = {};
    if (platform) where.primaryPlatform = platform;
    if (status) where.availabilityStatus = status;
    if (verified !== undefined) where.isVerified = verified === 'true';
    
    const influencers = await prisma.influencer.findMany({
      where,
      include: {
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
      orderBy: {
        qualityScore: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: influencers,
      count: influencers.length
    });
  } catch (error) {
    console.error('Error fetching influencers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch influencers'
    });
  }
});

app.get('/api/v1/influencers/:id', async (req, res) => {
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { influencerId: req.params.id },
      include: {
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
    });
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        error: 'Influencer not found'
      });
    }
    
    res.json({
      success: true,
      data: influencer
    });
  } catch (error) {
    console.error('Error fetching influencer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch influencer'
    });
  }
});

app.post('/api/v1/influencers', async (req, res) => {
  try {
    const influencer = await prisma.influencer.create({
      data: req.body
    });
    
    res.status(201).json({
      success: true,
      data: influencer
    });
  } catch (error) {
    console.error('Error creating influencer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create influencer'
    });
  }
});

// API v1 routes - Campaign-Influencer Collaborations
app.get('/api/v1/collaborations', async (req, res) => {
  try {
    const { campaignId, influencerId, status } = req.query;
    
    const where = {};
    if (campaignId) where.campaignId = campaignId;
    if (influencerId) where.influencerId = influencerId;
    if (status) where.collaborationStatus = status;
    
    const collaborations = await prisma.campaignInfluencer.findMany({
      where,
      include: {
        campaign: {
          select: {
            campaignId: true,
            campaignName: true,
            status: true,
            client: {
              select: {
                brandDisplayName: true
              }
            }
          }
        },
        influencer: {
          select: {
            influencerId: true,
            displayName: true,
            fullName: true,
            primaryPlatform: true
          }
        }
      },
      orderBy: {
        invitedAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: collaborations,
      count: collaborations.length
    });
  } catch (error) {
    console.error('Error fetching collaborations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaborations'
    });
  }
});

app.post('/api/v1/collaborations', async (req, res) => {
  try {
    const collaboration = await prisma.campaignInfluencer.create({
      data: req.body,
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: collaboration
    });
  } catch (error) {
    console.error('Error creating collaboration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create collaboration'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TIKIT Backend API',
    version: '0.3.1',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        profile: 'GET /api/v1/auth/profile (protected)',
        updateProfile: 'PUT /api/v1/auth/profile (protected)',
        changePassword: 'POST /api/v1/auth/change-password (protected)'
      },
      clients: '/api/v1/clients',
      campaigns: '/api/v1/campaigns',
      influencers: '/api/v1/influencers',
      collaborations: '/api/v1/collaborations',
      'filters': 'All endpoints support filtering via query params'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TIKIT Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/v1/auth`);
  console.log(`👥 Clients API: http://localhost:${PORT}/api/v1/clients`);
  console.log(`🎯 Campaigns API: http://localhost:${PORT}/api/v1/campaigns`);
  console.log(`⭐ Influencers API: http://localhost:${PORT}/api/v1/influencers`);
  console.log(`🤝 Collaborations API: http://localhost:${PORT}/api/v1/collaborations`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
