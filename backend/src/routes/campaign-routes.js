// Campaign Management Routes with Lifecycle Support
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication, requireRole } = require('../middleware/access-control');

const prisma = new PrismaClient();

// Campaign status transition rules
const CAMPAIGN_STATUS_TRANSITIONS = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  completed: [],
  cancelled: []
};

// Validate status transition
function canTransitionStatus(currentStatus, newStatus) {
  const allowedTransitions = CAMPAIGN_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// List all campaigns (authenticated users only)
router.get('/', requireAuthentication, async (req, res) => {
  try {
    const { status, clientId } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (clientId) whereClause.clientId = clientId;
    
    const campaignList = await prisma.campaign.findMany({
      where: whereClause,
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
      data: campaignList,
      count: campaignList.length
    });
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

// Get single campaign by ID (authenticated users only)
router.get('/:id', requireAuthentication, async (req, res) => {
  try {
    const campaignRecord = await prisma.campaign.findUnique({
      where: { campaignId: req.params.id },
      include: {
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
      }
    });
    
    if (!campaignRecord) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.json({
      success: true,
      data: campaignRecord
    });
  } catch (err) {
    console.error('Error fetching campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

// Create new campaign (authenticated users only)
router.post('/', requireAuthentication, async (req, res) => {
  try {
    // Set default status to draft if not provided
    const campaignData = {
      ...req.body,
      status: req.body.status || 'draft'
    };
    
    const newCampaign = await prisma.campaign.create({
      data: campaignData,
      include: {
        client: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: newCampaign
    });
  } catch (err) {
    console.error('Error creating campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
});

// Update campaign (authenticated users only)
router.put('/:id', requireAuthentication, async (req, res) => {
  try {
    const existingCampaign = await prisma.campaign.findUnique({
      where: { campaignId: req.params.id }
    });
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // If status is being changed, validate the transition
    if (req.body.status && req.body.status !== existingCampaign.status) {
      if (!canTransitionStatus(existingCampaign.status, req.body.status)) {
        return res.status(400).json({
          success: false,
          error: `Cannot transition campaign from ${existingCampaign.status} to ${req.body.status}`,
          allowedTransitions: CAMPAIGN_STATUS_TRANSITIONS[existingCampaign.status]
        });
      }
    }
    
    const updatedCampaign = await prisma.campaign.update({
      where: { campaignId: req.params.id },
      data: req.body,
      include: {
        client: true
      }
    });
    
    res.json({
      success: true,
      data: updatedCampaign
    });
  } catch (err) {
    console.error('Error updating campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
});

// Activate campaign (change status from draft to active)
router.post('/:id/activate', requireAuthentication, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error activating campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to activate campaign'
    });
  }
});

// Pause campaign
router.post('/:id/pause', requireAuthentication, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error pausing campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to pause campaign'
    });
  }
});

// Resume campaign (unpause)
router.post('/:id/resume', requireAuthentication, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error resuming campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to resume campaign'
    });
  }
});

// Complete campaign
router.post('/:id/complete', requireAuthentication, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error completing campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to complete campaign'
    });
  }
});

// Cancel campaign
router.post('/:id/cancel', requireAuthentication, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error cancelling campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel campaign'
    });
  }
});

// Get campaign budget status
router.get('/:id/budget', requireAuthentication, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error fetching campaign budget:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign budget'
    });
  }
});

// Delete campaign (admin only)
router.delete('/:id', requireAuthentication, requireRole(['admin']), async (req, res) => {
  try {
    await prisma.campaign.delete({
      where: { campaignId: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign'
    });
  }
});

module.exports = router;
