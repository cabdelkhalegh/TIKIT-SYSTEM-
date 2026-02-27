// Content Workflow Routes (Script → Draft → Final) with Two-Stage Approval
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication, requireV2Role } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const createRoleBasedMethodMiddleware = require('../middleware/role-based-method');

const prisma = new PrismaClient();

// Create base CRUD router
const router = createCrudRouter({
  prisma,
  modelName: 'content',
  idField: 'id',
  includeRelations: {
    list: {
      collaboration: {
        select: {
          id: true,
          campaignId: true,
          influencerId: true,
          collaborationStatus: true
        }
      }
    },
    default: {
      collaboration: true
    }
  },
  listFilters: {
    collaborationId: 'collaborationId'
  },
  orderBy: { createdAt: 'desc' }
});

// Apply authentication middleware to all routes
router.use('/', requireAuthentication);

// Apply role-based access control
router.use('/', createRoleBasedMethodMiddleware({
  mutation: ['admin', 'client_manager'],
  delete: ['admin']
}));

// ─── T064: Two-Stage Content Approval Workflow ───────────────────────────────

// POST /content/:id/approve-internal — Internal approval (Stage 1)
// Roles: director, campaign_manager
router.post('/:id/approve-internal', requireAuthentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const userRole = req.authenticatedUser.role;

    // V2 role check
    const allowedRoles = ['director', 'campaign_manager'];
    const hasV2Role = await prisma.userRole.count({
      where: { userId: req.authenticatedUser.userId, role: { in: allowedRoles } }
    });
    if (!hasV2Role && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Insufficient access rights for this operation' });
    }

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    if (content.approvalStatus !== 'pending' && content.approvalStatus !== 'changes_requested') {
      return res.status(400).json({ success: false, error: 'Content must be in pending or changes_requested status for internal approval' });
    }

    // For script type, clearing internal approval unlocks filming gate
    const updateData = {
      approvalStatus: 'internal_approved',
      internalFeedback: feedback || null,
    };
    if (content.type === 'script') {
      updateData.filmingBlocked = false;
    }

    const updated = await prisma.content.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        approvalStatus: updated.approvalStatus,
        filmingBlocked: updated.filmingBlocked,
        updatedAt: updated.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error in approve-internal:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve content internally' });
  }
});

// POST /content/:id/approve-client — Client approval (Stage 2)
// Roles: director, campaign_manager, client
router.post('/:id/approve-client', requireAuthentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const userRole = req.authenticatedUser.role;

    const allowedRoles = ['director', 'campaign_manager', 'client'];
    const hasV2Role = await prisma.userRole.count({
      where: { userId: req.authenticatedUser.userId, role: { in: allowedRoles } }
    });
    if (!hasV2Role && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Insufficient access rights for this operation' });
    }

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    if (content.approvalStatus !== 'internal_approved') {
      return res.status(400).json({ success: false, error: 'Content must be internally approved before client approval' });
    }

    // For final type, clearing client approval unlocks posting gate
    const updateData = {
      approvalStatus: 'client_approved',
      clientFeedback: feedback || null,
    };
    if (content.type === 'final') {
      updateData.postingBlocked = false;
    }

    const updated = await prisma.content.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        approvalStatus: updated.approvalStatus,
        postingBlocked: updated.postingBlocked,
        updatedAt: updated.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error in approve-client:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve content for client' });
  }
});

// POST /content/:id/request-changes — Request changes with feedback
// Roles: director, campaign_manager, client
router.post('/:id/request-changes', requireAuthentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, source } = req.body;
    const userRole = req.authenticatedUser.role;

    const allowedRoles = ['director', 'campaign_manager', 'client'];
    const hasV2Role = await prisma.userRole.count({
      where: { userId: req.authenticatedUser.userId, role: { in: allowedRoles } }
    });
    if (!hasV2Role && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Insufficient access rights for this operation' });
    }

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ success: false, error: 'feedback is required when requesting changes' });
    }

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Determine feedback source: internal or client
    const isClientRole = userRole === 'client' || source === 'client';
    const feedbackField = isClientRole ? 'clientFeedback' : 'internalFeedback';

    const updated = await prisma.content.update({
      where: { id },
      data: {
        approvalStatus: 'changes_requested',
        [feedbackField]: feedback.trim(),
      },
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        approvalStatus: updated.approvalStatus,
        internalFeedback: updated.internalFeedback,
        clientFeedback: updated.clientFeedback,
        updatedAt: updated.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error in request-changes:', error);
    return res.status(500).json({ success: false, error: 'Failed to request changes' });
  }
});

// POST /content/:id/exception — Director exception to bypass gate
// Roles: director only
router.post('/:id/exception', requireAuthentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { exceptionType, evidence } = req.body;
    const userRole = req.authenticatedUser.role;

    const allowedRoles = ['director'];
    const hasV2Role = await prisma.userRole.count({
      where: { userId: req.authenticatedUser.userId, role: { in: allowedRoles } }
    });
    if (!hasV2Role && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Insufficient access rights for this operation' });
    }

    const validTypes = ['urgent_posting', 'verbal_approval', 'client_timeout'];
    if (!exceptionType || !validTypes.includes(exceptionType)) {
      return res.status(400).json({ success: false, error: 'exceptionType must be one of: urgent_posting, verbal_approval, client_timeout' });
    }

    if (!evidence || !evidence.trim()) {
      return res.status(400).json({ success: false, error: 'evidence is required for exception requests' });
    }

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    const updated = await prisma.content.update({
      where: { id },
      data: {
        exceptionType,
        exceptionEvidence: evidence.trim(),
        exceptionApprovedBy: req.authenticatedUser.userId,
        postingBlocked: false, // Exception bypasses posting gate
      },
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        exceptionType: updated.exceptionType,
        exceptionEvidence: updated.exceptionEvidence,
        message: 'Exception approved. Posting gate bypassed.',
      }
    });
  } catch (error) {
    console.error('Error in exception:', error);
    return res.status(500).json({ success: false, error: 'Failed to process exception' });
  }
});

// ─── T065: POST /content/:id/live-url — Submit live post URL ─────────────────
// Validates posting gate + posting schedule on CampaignInfluencer
// Roles: director, campaign_manager, influencer
router.post('/:id/live-url', requireAuthentication, async (req, res) => {
  try {
    const { id } = req.params;
    const { livePostUrl } = req.body;
    const userRole = req.authenticatedUser.role;

    const allowedRoles = ['director', 'campaign_manager', 'influencer'];
    const hasV2Role = await prisma.userRole.count({
      where: { userId: req.authenticatedUser.userId, role: { in: allowedRoles } }
    });
    if (!hasV2Role && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Insufficient access rights for this operation' });
    }

    if (!livePostUrl || !livePostUrl.trim()) {
      return res.status(400).json({ success: false, error: 'livePostUrl is required' });
    }

    // Basic URL validation
    try {
      new URL(livePostUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'livePostUrl must be a valid URL' });
    }

    const content = await prisma.content.findUnique({
      where: { id },
      include: { collaboration: true },
    });
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Posting gate: content must be client_approved or have an exception
    if (content.postingBlocked) {
      return res.status(400).json({
        success: false,
        error: 'Posting is blocked — content must receive client approval or Director exception first'
      });
    }

    // T065: Posting schedule validation — scheduledPostDate and postPlatform must be set
    const campaignInfluencer = content.collaboration;
    if (!campaignInfluencer.scheduledPostDate || !campaignInfluencer.postPlatform) {
      return res.status(400).json({
        success: false,
        error: 'Posting schedule required before submitting live URL'
      });
    }

    const updated = await prisma.content.update({
      where: { id },
      data: {
        livePostUrl: livePostUrl.trim(),
        approvalStatus: 'client_approved', // Keep as client_approved (live is a status on CampaignInfluencer)
      },
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        livePostUrl: updated.livePostUrl,
        updatedAt: updated.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error in live-url:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit live URL' });
  }
});

// GET /content/pending — Global pending content across all campaigns
// Roles: director, campaign_manager, reviewer
router.get('/pending', requireAuthentication, async (req, res) => {
  try {
    const userRole = req.authenticatedUser.role;
    const allowedRoles = ['director', 'campaign_manager', 'reviewer'];
    const hasV2Role = await prisma.userRole.count({
      where: { userId: req.authenticatedUser.userId, role: { in: allowedRoles } }
    });
    if (!hasV2Role && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Insufficient access rights for this operation' });
    }

    const { page = 1, limit = 20, type, approvalStatus = 'pending' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      approvalStatus: { notIn: ['client_approved'] },
      livePostUrl: null, // Not yet live
    };
    if (type) where.type = type;
    if (approvalStatus && approvalStatus !== 'all') {
      where.approvalStatus = approvalStatus;
    }

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          campaign: { select: { campaignId: true, displayId: true, campaignName: true } },
          collaboration: {
            include: {
              influencer: { select: { influencerId: true, displayId: true, instagramHandle: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.content.count({ where }),
    ]);

    const formattedContent = content.map(c => ({
      id: c.id,
      campaign: c.campaign ? {
        id: c.campaign.campaignId,
        displayId: c.campaign.displayId,
        name: c.campaign.campaignName,
      } : null,
      influencer: c.collaboration?.influencer ? {
        id: c.collaboration.influencer.influencerId,
        displayId: c.collaboration.influencer.displayId,
        handle: c.collaboration.influencer.instagramHandle,
      } : null,
      type: c.type,
      versionNumber: c.version,
      approvalStatus: c.approvalStatus,
      fileName: c.fileName,
      filmingBlocked: c.filmingBlocked,
      postingBlocked: c.postingBlocked,
      createdAt: c.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        content: formattedContent,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      }
    });
  } catch (error) {
    console.error('Error in pending content:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch pending content' });
  }
});

module.exports = router;
