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

// API v1 routes
app.get('/api/v1/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany();
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TIKIT Backend API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      clients: '/api/v1/clients'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TIKIT Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/v1/clients`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
