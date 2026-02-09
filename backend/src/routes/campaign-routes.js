// Campaign Management Routes with Lifecycle Support
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const createRoleBasedMethodMiddleware = require('../middleware/role-based-method');
const asyncHandler = require('../middleware/async-handler');
const { createStatusValidator, createStatusTransitionHandler, CAMPAIGN_STATUS_TRANSITIONS } = require('../utils/status-transition-helper');

const prisma = new PrismaClient();
const canTransitionStatus = createStatusValidator(CAMPAIGN_STATUS_TRANSITIONS);

// Create a reusable status transition handler for campaigns
const handleCampaignStatusTransition = createStatusTransitionHandler({
  prisma,
  modelName: 'campaign',
  idField: 'campaignId',
  validator: canTransitionStatus,
  includeRelations: { client: true }
});

// Create base CRUD router with custom filters and hooks
const router = createCrudRouter({
  prisma,
  modelName: 'campaign',
  idField: 'campaignId',
  listFilters: {
    status: 'status',
    clientId: 'clientId'
  },
  includeRelations: {
    list: {
      client: {
        select: {
          clientId: true,
          brandDisplayName: true,
          legalCompanyName: true
        }
      }
    },
    detail: {
      client: true,
      campaignInfluencers: {
        include: {
          influencer: {
            select: {
              influencerId: true,
              displayName: true,
              fullName: true
            }
          }
        }
      }
    },
    default: {
      client: true
    }
  },
  beforeCreate: (data) => {
    // Set default status to draft if not provided
    return { ...data, status: data.status || 'draft' };
  },
  beforeUpdate: async (id, data, existingEntity, req, res) => {
    // If status is being changed, validate the transition
    if (data.status && existingEntity && data.status !== existingEntity.status) {
      if (!canTransitionStatus(existingEntity.status, data.status)) {
        res.status(400).json({
          success: false,
          error: `Cannot transition campaign from ${existingEntity.status} to ${data.status}`,
          allowedTransitions: CAMPAIGN_STATUS_TRANSITIONS[existingEntity.status]
        });
        return; // Return undefined to stop processing
      }
    }
    return data;
  }
});

// Apply authentication to all routes
router.use('/', requireAuthentication);

// Apply role-based access control
router.use('/', createRoleBasedMethodMiddleware({
  delete: ['admin']
}));

// Activate campaign (change status from draft to active)
router.post('/:id/activate', asyncHandler(async (req, res) => {
  return handleCampaignStatusTransition(
    req,
    res,
    'active',
    'Campaign activated successfully',
    (record) => ({
      launchDate: record.launchDate || new Date()
    })
  );
}));

// Pause campaign
router.post('/:id/pause', asyncHandler(async (req, res) => {
  return handleCampaignStatusTransition(
    req,
    res,
    'paused',
    'Campaign paused successfully'
  );
}));

// Resume campaign (unpause)
router.post('/:id/resume', asyncHandler(async (req, res) => {
  return handleCampaignStatusTransition(
    req,
    res,
    'active',
    'Campaign resumed successfully'
  );
}));

// Complete campaign
router.post('/:id/complete', asyncHandler(async (req, res) => {
  return handleCampaignStatusTransition(
    req,
    res,
    'completed',
    'Campaign completed successfully',
    (record) => ({
      endDate: record.endDate || new Date()
    })
  );
}));

// Cancel campaign
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  return handleCampaignStatusTransition(
    req,
    res,
    'cancelled',
    'Campaign cancelled successfully'
  );
}));

// Get campaign budget status
router.get('/:id/budget', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
    select: {
      campaignId: true,
      campaignName: true,
      totalBudget: true,
      allocatedBudget: true,
      spentBudget: true,
      status: true
    }
  });
  
  if (!campaignRecord) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }
  
  const budgetRemaining = (campaignRecord.totalBudget || 0) - (campaignRecord.spentBudget || 0);
  const budgetUtilization = campaignRecord.totalBudget > 0 
    ? ((campaignRecord.spentBudget || 0) / campaignRecord.totalBudget * 100).toFixed(2)
    : 0;
  
  res.json({
    success: true,
    data: {
      ...campaignRecord,
      budgetRemaining,
      budgetUtilization: parseFloat(budgetUtilization)
    }
  });
}));

// Note: DELETE endpoint is provided by the CRUD factory above
// Role-based access control for DELETE is handled by the role-based-method middleware

module.exports = router;
