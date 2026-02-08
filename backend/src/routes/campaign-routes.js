// Campaign Management Routes with Lifecycle Support
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const createRoleBasedMethodMiddleware = require('../middleware/role-based-method');
const asyncHandler = require('../middleware/async-handler');
const { createStatusValidator, CAMPAIGN_STATUS_TRANSITIONS } = require('../utils/status-transition-helper');

const prisma = new PrismaClient();
const canTransitionStatus = createStatusValidator(CAMPAIGN_STATUS_TRANSITIONS);

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
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id }
  });
  
  if (!campaignRecord) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }
  
  if (!canTransitionStatus(campaignRecord.status, 'active')) {
    return res.status(400).json({
      success: false,
      error: `Cannot activate campaign with status ${campaignRecord.status}`,
      currentStatus: campaignRecord.status
    });
  }
  
  const activatedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: { 
      status: 'active',
      launchDate: campaignRecord.launchDate || new Date()
    },
    include: {
      client: true
    }
  });
  
  res.json({
    success: true,
    data: activatedCampaign,
    message: 'Campaign activated successfully'
  });
}));

// Pause campaign
router.post('/:id/pause', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id }
  });
  
  if (!campaignRecord) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }
  
  if (!canTransitionStatus(campaignRecord.status, 'paused')) {
    return res.status(400).json({
      success: false,
      error: `Cannot pause campaign with status ${campaignRecord.status}`,
      currentStatus: campaignRecord.status
    });
  }
  
  const pausedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: { status: 'paused' },
    include: {
      client: true
    }
  });
  
  res.json({
    success: true,
    data: pausedCampaign,
    message: 'Campaign paused successfully'
  });
}));

// Resume campaign (unpause)
router.post('/:id/resume', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id }
  });
  
  if (!campaignRecord) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }
  
  if (campaignRecord.status !== 'paused') {
    return res.status(400).json({
      success: false,
      error: 'Only paused campaigns can be resumed',
      currentStatus: campaignRecord.status
    });
  }
  
  const resumedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: { status: 'active' },
    include: {
      client: true
    }
  });
  
  res.json({
    success: true,
    data: resumedCampaign,
    message: 'Campaign resumed successfully'
  });
}));

// Complete campaign
router.post('/:id/complete', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id }
  });
  
  if (!campaignRecord) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }
  
  if (!canTransitionStatus(campaignRecord.status, 'completed')) {
    return res.status(400).json({
      success: false,
      error: `Cannot complete campaign with status ${campaignRecord.status}`,
      currentStatus: campaignRecord.status
    });
  }
  
  const completedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: { 
      status: 'completed',
      endDate: campaignRecord.endDate || new Date()
    },
    include: {
      client: true
    }
  });
  
  res.json({
    success: true,
    data: completedCampaign,
    message: 'Campaign completed successfully'
  });
}));

// Cancel campaign
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id }
  });
  
  if (!campaignRecord) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }
  
  if (!canTransitionStatus(campaignRecord.status, 'cancelled')) {
    return res.status(400).json({
      success: false,
      error: `Cannot cancel campaign with status ${campaignRecord.status}`,
      currentStatus: campaignRecord.status
    });
  }
  
  const { reason } = req.body;
  
  const cancelledCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: { 
      status: 'cancelled',
      // Could store cancellation reason in a notes field if available
    },
    include: {
      client: true
    }
  });
  
  res.json({
    success: true,
    data: cancelledCampaign,
    message: 'Campaign cancelled successfully',
    reason: reason || 'No reason provided'
  });
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

// Delete campaign (admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.campaign.delete({
    where: { campaignId: req.params.id }
  });
  
  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
}));

module.exports = router;
