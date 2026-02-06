// Campaign-Influencer Collaboration Routes
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication, requireRole } = require('../middleware/access-control');

const prisma = new PrismaClient();

// Collaboration status workflow
const COLLABORATION_STATUS_TRANSITIONS = {
  invited: ['accepted', 'declined'],
  accepted: ['active', 'cancelled'],
  declined: [],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

// Validate status transition
function canTransitionCollaborationStatus(currentStatus, newStatus) {
  const allowedTransitions = COLLABORATION_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// List all collaborations (authenticated users only)
router.get('/', requireAuthentication, async (req, res) => {
  try {
    const { campaignId, influencerId, status } = req.query;
    
    const whereClause = {};
    if (campaignId) whereClause.campaignId = campaignId;
    if (influencerId) whereClause.influencerId = influencerId;
    if (status) whereClause.collaborationStatus = status;
    
    const collaborationList = await prisma.campaignInfluencer.findMany({
      where: whereClause,
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
      data: collaborationList,
      count: collaborationList.length
    });
  } catch (err) {
    console.error('Error fetching collaborations:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaborations'
    });
  }
});

// Get single collaboration (authenticated users only)
router.get('/:id', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id },
      include: {
        campaign: {
          include: {
            client: true
          }
        },
        influencer: true
      }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    res.json({
      success: true,
      data: collaborationRecord
    });
  } catch (err) {
    console.error('Error fetching collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaboration'
    });
  }
});

// Create new collaboration (authenticated users only)
router.post('/', requireAuthentication, async (req, res) => {
  try {
    // Default status to invited if not provided
    const collaborationData = {
      ...req.body,
      collaborationStatus: req.body.collaborationStatus || 'invited',
      invitedAt: new Date()
    };
    
    const newCollaboration = await prisma.campaignInfluencer.create({
      data: collaborationData,
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: newCollaboration
    });
  } catch (err) {
    console.error('Error creating collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create collaboration'
    });
  }
});

// Update collaboration (authenticated users only)
router.put('/:id', requireAuthentication, async (req, res) => {
  try {
    const existingCollaboration = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!existingCollaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // If status is being changed, validate the transition
    if (req.body.collaborationStatus && req.body.collaborationStatus !== existingCollaboration.collaborationStatus) {
      if (!canTransitionCollaborationStatus(existingCollaboration.collaborationStatus, req.body.collaborationStatus)) {
        return res.status(400).json({
          success: false,
          error: `Cannot transition collaboration from ${existingCollaboration.collaborationStatus} to ${req.body.collaborationStatus}`,
          allowedTransitions: COLLABORATION_STATUS_TRANSITIONS[existingCollaboration.collaborationStatus]
        });
      }
    }
    
    const updatedCollaboration = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: req.body,
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      data: updatedCollaboration
    });
  } catch (err) {
    console.error('Error updating collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update collaboration'
    });
  }
});

// Accept collaboration invitation (influencer accepts)
router.post('/:id/accept', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    if (!canTransitionCollaborationStatus(collaborationRecord.collaborationStatus, 'accepted')) {
      return res.status(400).json({
        success: false,
        error: `Cannot accept collaboration with status ${collaborationRecord.collaborationStatus}`
      });
    }
    
    const acceptedCollaboration = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: { 
        collaborationStatus: 'accepted',
        acceptedAt: new Date()
      },
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      data: acceptedCollaboration,
      message: 'Collaboration accepted successfully'
    });
  } catch (err) {
    console.error('Error accepting collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to accept collaboration'
    });
  }
});

// Decline collaboration invitation
router.post('/:id/decline', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    if (!canTransitionCollaborationStatus(collaborationRecord.collaborationStatus, 'declined')) {
      return res.status(400).json({
        success: false,
        error: `Cannot decline collaboration with status ${collaborationRecord.collaborationStatus}`
      });
    }
    
    const declinedCollaboration = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: { 
        collaborationStatus: 'declined'
      },
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      data: declinedCollaboration,
      message: 'Collaboration declined'
    });
  } catch (err) {
    console.error('Error declining collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to decline collaboration'
    });
  }
});

// Start collaboration (move to active)
router.post('/:id/start', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    if (!canTransitionCollaborationStatus(collaborationRecord.collaborationStatus, 'active')) {
      return res.status(400).json({
        success: false,
        error: `Cannot start collaboration with status ${collaborationRecord.collaborationStatus}`
      });
    }
    
    const activeCollaboration = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: { 
        collaborationStatus: 'active'
      },
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      data: activeCollaboration,
      message: 'Collaboration started successfully'
    });
  } catch (err) {
    console.error('Error starting collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to start collaboration'
    });
  }
});

// Complete collaboration
router.post('/:id/complete', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    if (!canTransitionCollaborationStatus(collaborationRecord.collaborationStatus, 'completed')) {
      return res.status(400).json({
        success: false,
        error: `Cannot complete collaboration with status ${collaborationRecord.collaborationStatus}`
      });
    }
    
    const completedCollaboration = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: { 
        collaborationStatus: 'completed',
        completedAt: new Date()
      },
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      data: completedCollaboration,
      message: 'Collaboration completed successfully'
    });
  } catch (err) {
    console.error('Error completing collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to complete collaboration'
    });
  }
});

// Cancel collaboration
router.post('/:id/cancel', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    if (!canTransitionCollaborationStatus(collaborationRecord.collaborationStatus, 'cancelled')) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel collaboration with status ${collaborationRecord.collaborationStatus}`
      });
    }
    
    const cancelledCollaboration = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: { 
        collaborationStatus: 'cancelled'
      },
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      data: cancelledCollaboration,
      message: 'Collaboration cancelled successfully'
    });
  } catch (err) {
    console.error('Error cancelling collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel collaboration'
    });
  }
});

// Delete collaboration (admin only)
router.delete('/:id', requireAuthentication, requireRole(['admin']), async (req, res) => {
  try {
    await prisma.campaignInfluencer.delete({
      where: { collaborationId: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Collaboration deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting collaboration:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete collaboration'
    });
  }
});

module.exports = router;
