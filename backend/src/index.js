// TIKIT Backend API Server
// Main entry point for the backend application

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/auth-routes');
const clientRoutes = require('./routes/client-routes');
const campaignRoutes = require('./routes/campaign-routes');
const influencerRoutes = require('./routes/influencer-routes');
const collaborationRoutes = require('./routes/collaboration-routes');
const analyticsRoutes = require('./routes/analytics-routes');
const notificationRoutes = require('./routes/notification-routes');
const mediaRoutes = require('./routes/media-routes');

// Import middleware
const requestLogger = require('./middleware/request-logger');
const createRateLimiter = require('./middleware/rate-limiter');
const globalErrorHandler = require('./middleware/error-handler');

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Rate limiting (100 requests per 15 minutes)
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', generalRateLimiter);

// Serve static files (uploaded media)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/influencers', influencerRoutes);
app.use('/api/v1/collaborations', collaborationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/media', mediaRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TIKIT Backend API',
    timestamp: new Date().toISOString(),
    version: '0.5.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TIKIT Backend API',
    version: '0.5.0',
    features: {
      authentication: 'JWT-based authentication with role-based access control',
      campaignLifecycle: 'Campaign status transitions (draft → active → paused/completed)',
      collaborationWorkflow: 'Influencer collaboration lifecycle management'
    },
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        profile: 'GET /api/v1/auth/profile (protected)',
        updateProfile: 'PUT /api/v1/auth/profile (protected)',
        changePassword: 'POST /api/v1/auth/change-password (protected)'
      },
      clients: {
        list: 'GET /api/v1/clients (protected)',
        get: 'GET /api/v1/clients/:id (protected)',
        create: 'POST /api/v1/clients (protected: admin, client_manager)',
        update: 'PUT /api/v1/clients/:id (protected: admin, client_manager)',
        delete: 'DELETE /api/v1/clients/:id (protected: admin)'
      },
      campaigns: {
        list: 'GET /api/v1/campaigns (protected, filters: status, clientId)',
        get: 'GET /api/v1/campaigns/:id (protected)',
        create: 'POST /api/v1/campaigns (protected)',
        update: 'PUT /api/v1/campaigns/:id (protected)',
        delete: 'DELETE /api/v1/campaigns/:id (protected: admin)',
        activate: 'POST /api/v1/campaigns/:id/activate (protected)',
        pause: 'POST /api/v1/campaigns/:id/pause (protected)',
        resume: 'POST /api/v1/campaigns/:id/resume (protected)',
        complete: 'POST /api/v1/campaigns/:id/complete (protected)',
        cancel: 'POST /api/v1/campaigns/:id/cancel (protected)',
        budget: 'GET /api/v1/campaigns/:id/budget (protected)'
      },
      influencers: {
        list: 'GET /api/v1/influencers (protected, filters: platform, status, verified)',
        get: 'GET /api/v1/influencers/:id (protected)',
        create: 'POST /api/v1/influencers (protected: admin, influencer_manager)',
        update: 'PUT /api/v1/influencers/:id (protected: admin, influencer_manager)',
        delete: 'DELETE /api/v1/influencers/:id (protected: admin)'
      },
      collaborations: {
        list: 'GET /api/v1/collaborations (protected, filters: campaignId, influencerId, status)',
        get: 'GET /api/v1/collaborations/:id (protected)',
        create: 'POST /api/v1/collaborations (protected)',
        update: 'PUT /api/v1/collaborations/:id (protected)',
        delete: 'DELETE /api/v1/collaborations/:id (protected: admin)',
        accept: 'POST /api/v1/collaborations/:id/accept (protected)',
        decline: 'POST /api/v1/collaborations/:id/decline (protected)',
        start: 'POST /api/v1/collaborations/:id/start (protected)',
        complete: 'POST /api/v1/collaborations/:id/complete (protected)',
        cancel: 'POST /api/v1/collaborations/:id/cancel (protected)'
      }
    }
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TIKIT Backend API v0.5.0 running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/v1/auth`);
  console.log(`👥 Clients API: http://localhost:${PORT}/api/v1/clients (protected)`);
  console.log(`🎯 Campaigns API: http://localhost:${PORT}/api/v1/campaigns (protected, with lifecycle)`);
  console.log(`⭐ Influencers API: http://localhost:${PORT}/api/v1/influencers (protected, with discovery)`);
  console.log(`🤝 Collaborations API: http://localhost:${PORT}/api/v1/collaborations (protected, enhanced workflow)`);
  console.log(`\n✨ Features: Auth, Lifecycle, Discovery, Enhanced Collaboration, Validation & Error Handling`);
  console.log(`🛡️ Security: Rate limiting (100 req/15min), Input validation, Error handling`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
