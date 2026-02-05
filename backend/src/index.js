// TIKIT Backend API Server
// Main entry point for the backend application

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TIKIT Backend API',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TIKIT Backend API',
    version: '0.2.0',
    endpoints: {
      health: '/health',
      clients: '/api/v1/clients',
      campaigns: '/api/v1/campaigns',
      'campaigns (filter)': '/api/v1/campaigns?status=active&clientId={id}'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TIKIT Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Clients API: http://localhost:${PORT}/api/v1/clients`);
  console.log(`🎯 Campaigns API: http://localhost:${PORT}/api/v1/campaigns`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
