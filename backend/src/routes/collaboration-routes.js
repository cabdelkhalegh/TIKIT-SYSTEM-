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

// ========================================
// PHASE 3.4: ENHANCED COLLABORATION MANAGEMENT
// ========================================

// Bulk invite influencers to campaign
router.post('/invite-bulk', requireAuthentication, async (req, res) => {
  try {
    const { campaignId, influencerIds, roleDescription, agreedPaymentAmount } = req.body;
    
    if (!campaignId || !influencerIds || !Array.isArray(influencerIds) || influencerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID and array of influencer IDs are required'
      });
    }
    
    // Verify campaign exists
    const campaignRecord = await prisma.campaign.findUnique({
      where: { campaignId }
    });
    
    if (!campaignRecord) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Check for existing collaborations
    const existingCollabs = await prisma.campaignInfluencer.findMany({
      where: {
        campaignId,
        influencerId: { in: influencerIds }
      },
      select: { influencerId: true }
    });
    
    const existingInfluencerIds = existingCollabs.map(c => c.influencerId);
    const newInfluencerIds = influencerIds.filter(id => !existingInfluencerIds.includes(id));
    
    if (newInfluencerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'All influencers already have collaborations with this campaign',
        existing: existingInfluencerIds.length
      });
    }
    
    // Create collaborations for new influencers
    const invitationData = newInfluencerIds.map(influencerId => ({
      campaignId,
      influencerId,
      roleDescription: roleDescription || 'Content Creator',
      collaborationStatus: 'invited',
      paymentStatus: 'pending',
      agreedPaymentAmount: agreedPaymentAmount || null,
      invitedAt: new Date()
    }));
    
    const createdCollabs = await prisma.campaignInfluencer.createMany({
      data: invitationData
    });
    
    // Fetch the created collaborations with details
    const newCollaborations = await prisma.campaignInfluencer.findMany({
      where: {
        campaignId,
        influencerId: { in: newInfluencerIds }
      },
      include: {
        influencer: {
          select: {
            influencerId: true,
            displayName: true,
            fullName: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: `Successfully invited ${createdCollabs.count} influencers`,
      data: {
        invited: createdCollabs.count,
        skipped: existingInfluencerIds.length,
        collaborations: newCollaborations
      }
    });
  } catch (err) {
    console.error('Error creating bulk invitations:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk invitations'
    });
  }
});

// Submit deliverable
router.post('/:id/deliverables/submit', requireAuthentication, async (req, res) => {
  try {
    const { deliverableType, contentUrl, description, performanceData } = req.body;
    
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Update deliverable information
    const currentDeliverables = collaborationRecord.deliveredContent || [];
    const newDeliverable = {
      type: deliverableType,
      url: contentUrl,
      description: description || '',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      performanceData: performanceData || {}
    };
    
    const updatedRecord = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: {
        deliveredContent: [...currentDeliverables, newDeliverable]
      },
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      message: 'Deliverable submitted successfully',
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error submitting deliverable:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to submit deliverable'
    });
  }
});

// Review deliverable
router.post('/:id/deliverables/review', requireAuthentication, async (req, res) => {
  try {
    const { deliverableIndex, reviewNotes } = req.body;
    
    if (deliverableIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Deliverable index is required'
      });
    }
    
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    const deliverables = collaborationRecord.deliveredContent || [];
    if (deliverableIndex < 0 || deliverableIndex >= deliverables.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deliverable index'
      });
    }
    
    deliverables[deliverableIndex].status = 'under_review';
    deliverables[deliverableIndex].reviewNotes = reviewNotes || '';
    deliverables[deliverableIndex].reviewedAt = new Date().toISOString();
    
    const updatedRecord = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: {
        deliveredContent: deliverables
      }
    });
    
    res.json({
      success: true,
      message: 'Deliverable marked for review',
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error reviewing deliverable:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to review deliverable'
    });
  }
});

// Approve deliverable
router.post('/:id/deliverables/approve', requireAuthentication, async (req, res) => {
  try {
    const { deliverableIndex, approvalNotes } = req.body;
    
    if (deliverableIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Deliverable index is required'
      });
    }
    
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    const deliverables = collaborationRecord.deliveredContent || [];
    if (deliverableIndex < 0 || deliverableIndex >= deliverables.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deliverable index'
      });
    }
    
    deliverables[deliverableIndex].status = 'approved';
    deliverables[deliverableIndex].approvalNotes = approvalNotes || '';
    deliverables[deliverableIndex].approvedAt = new Date().toISOString();
    
    const updatedRecord = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: {
        deliveredContent: deliverables
      }
    });
    
    res.json({
      success: true,
      message: 'Deliverable approved',
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error approving deliverable:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to approve deliverable'
    });
  }
});

// Reject deliverable
router.post('/:id/deliverables/reject', requireAuthentication, async (req, res) => {
  try {
    const { deliverableIndex, rejectionReason } = req.body;
    
    if (deliverableIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Deliverable index is required'
      });
    }
    
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    const deliverables = collaborationRecord.deliveredContent || [];
    if (deliverableIndex < 0 || deliverableIndex >= deliverables.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deliverable index'
      });
    }
    
    deliverables[deliverableIndex].status = 'rejected';
    deliverables[deliverableIndex].rejectionReason = rejectionReason || 'Not specified';
    deliverables[deliverableIndex].rejectedAt = new Date().toISOString();
    
    const updatedRecord = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: {
        deliveredContent: deliverables
      }
    });
    
    res.json({
      success: true,
      message: 'Deliverable rejected',
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error rejecting deliverable:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reject deliverable'
    });
  }
});

// Update payment status
router.put('/:id/payment', requireAuthentication, async (req, res) => {
  try {
    const { paymentStatus, paymentAmount, transactionDetails } = req.body;
    
    const validStatuses = ['pending', 'partial', 'paid'];
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    const updateData = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    // Track payment transactions
    if (paymentAmount || transactionDetails) {
      const currentPerformance = collaborationRecord.actualPerformanceMetrics || {};
      const paymentHistory = currentPerformance.paymentHistory || [];
      
      paymentHistory.push({
        amount: paymentAmount || 0,
        status: paymentStatus || collaborationRecord.paymentStatus,
        transactionDetails: transactionDetails || {},
        paidAt: new Date().toISOString()
      });
      
      updateData.actualPerformanceMetrics = {
        ...currentPerformance,
        paymentHistory,
        totalPaid: paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0)
      };
    }
    
    const updatedRecord = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: updateData,
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment'
    });
  }
});

// Get collaboration analytics
router.get('/:id/analytics', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id },
      include: {
        campaign: true,
        influencer: true
      }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    // Calculate analytics
    const performanceMetrics = collaborationRecord.actualPerformanceMetrics || {};
    const deliverables = collaborationRecord.deliveredContent || [];
    
    const analytics = {
      collaboration: {
        id: collaborationRecord.collaborationId,
        status: collaborationRecord.collaborationStatus,
        role: collaborationRecord.roleDescription
      },
      campaign: {
        name: collaborationRecord.campaign.campaignName,
        budget: collaborationRecord.campaign.totalBudget
      },
      influencer: {
        name: collaborationRecord.influencer.displayName,
        platform: collaborationRecord.influencer.primaryPlatform
      },
      financial: {
        agreedAmount: collaborationRecord.agreedPaymentAmount || 0,
        paymentStatus: collaborationRecord.paymentStatus,
        totalPaid: performanceMetrics.totalPaid || 0,
        outstandingBalance: (collaborationRecord.agreedPaymentAmount || 0) - (performanceMetrics.totalPaid || 0)
      },
      deliverables: {
        total: deliverables.length,
        submitted: deliverables.filter(d => d.status === 'submitted').length,
        underReview: deliverables.filter(d => d.status === 'under_review').length,
        approved: deliverables.filter(d => d.status === 'approved').length,
        rejected: deliverables.filter(d => d.status === 'rejected').length
      },
      performance: {
        likes: performanceMetrics.likes || 0,
        comments: performanceMetrics.comments || 0,
        shares: performanceMetrics.shares || 0,
        views: performanceMetrics.views || 0,
        engagementRate: performanceMetrics.engagementRate || 0,
        estimatedReach: performanceMetrics.estimatedReach || 0
      },
      roi: {
        costPerEngagement: performanceMetrics.likes ? 
          ((collaborationRecord.agreedPaymentAmount || 0) / (performanceMetrics.likes + performanceMetrics.comments + performanceMetrics.shares)).toFixed(2) : 0,
        costPerView: performanceMetrics.views ? 
          ((collaborationRecord.agreedPaymentAmount || 0) / performanceMetrics.views).toFixed(2) : 0,
        estimatedReachValue: performanceMetrics.estimatedReach ? 
          (performanceMetrics.estimatedReach * 0.05).toFixed(2) : 0
      },
      timeline: {
        invited: collaborationRecord.invitedAt,
        accepted: collaborationRecord.acceptedAt,
        completed: collaborationRecord.completedAt,
        daysToAccept: collaborationRecord.acceptedAt && collaborationRecord.invitedAt ?
          Math.ceil((new Date(collaborationRecord.acceptedAt) - new Date(collaborationRecord.invitedAt)) / (1000 * 60 * 60 * 24)) : null,
        daysToComplete: collaborationRecord.completedAt && collaborationRecord.acceptedAt ?
          Math.ceil((new Date(collaborationRecord.completedAt) - new Date(collaborationRecord.acceptedAt)) / (1000 * 60 * 60 * 24)) : null
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Add note to collaboration
router.post('/:id/notes', requireAuthentication, async (req, res) => {
  try {
    const { noteText, noteCategory } = req.body;
    
    if (!noteText) {
      return res.status(400).json({
        success: false,
        error: 'Note text is required'
      });
    }
    
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    const currentPerformance = collaborationRecord.actualPerformanceMetrics || {};
    const notes = currentPerformance.notes || [];
    
    notes.push({
      text: noteText,
      category: noteCategory || 'general',
      author: req.user?.email || 'System',
      createdAt: new Date().toISOString()
    });
    
    const updatedRecord = await prisma.campaignInfluencer.update({
      where: { collaborationId: req.params.id },
      data: {
        actualPerformanceMetrics: {
          ...currentPerformance,
          notes
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error adding note:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to add note'
    });
  }
});

// Get all notes for collaboration
router.get('/:id/notes', requireAuthentication, async (req, res) => {
  try {
    const collaborationRecord = await prisma.campaignInfluencer.findUnique({
      where: { collaborationId: req.params.id },
      select: {
        collaborationId: true,
        actualPerformanceMetrics: true
      }
    });
    
    if (!collaborationRecord) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }
    
    const notes = collaborationRecord.actualPerformanceMetrics?.notes || [];
    
    res.json({
      success: true,
      data: {
        collaborationId: collaborationRecord.collaborationId,
        notes,
        count: notes.length
      }
    });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
});

module.exports = router;
