// T094: Influencer Portal Routes — scoped to campaigns assigned to the authenticated influencer user
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const asyncHandler = require('../middleware/async-handler');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();
const router = express.Router();

// ─── File upload config ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `content-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 GB
});

// ─── Middleware: require influencer role ───────────────────────────────────────
function requireInfluencerRole(req, res, next) {
  const legacyRole = req.authenticatedUser?.role;
  prisma.userRole.count({
    where: { userId: req.authenticatedUser.userId, role: 'influencer' }
  }).then((count) => {
    if (count > 0 || legacyRole === 'influencer') return next();
    return res.status(403).json({
      success: false,
      error: 'Influencer role required to access this resource'
    });
  }).catch(() => {
    return res.status(500).json({ success: false, error: 'Failed to verify role' });
  });
}

// ─── Helper: get influencer record linked to this user ────────────────────────
async function getInfluencerForUser(userId) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { managedInfluencerId: true, email: true }
  });
  if (!user) return null;

  // Try managedInfluencerId first
  if (user.managedInfluencerId) {
    return prisma.influencer.findUnique({
      where: { influencerId: user.managedInfluencerId }
    });
  }

  // Fallback: match by email
  return prisma.influencer.findUnique({
    where: { email: user.email }
  });
}

// ─── Helper: get campaign influencer assignments for this influencer ──────────
async function getAssignments(influencerId, statusFilter) {
  const where = { influencerId };
  if (statusFilter) {
    where.campaign = { status: { in: statusFilter }, isDeleted: false };
  } else {
    where.campaign = { isDeleted: false };
  }
  return prisma.campaignInfluencer.findMany({
    where,
    include: {
      campaign: {
        select: {
          campaignId: true, displayId: true, campaignName: true,
          status: true, startDate: true, endDate: true,
        }
      }
    }
  });
}

// ─── Helper: verify influencer is assigned to campaign ────────────────────────
async function verifyAssignment(influencerId, campaignId) {
  return prisma.campaignInfluencer.findFirst({
    where: { influencerId, campaignId }
  });
}

// Apply auth to all routes
router.use(requireAuthentication);
router.use(requireInfluencerRole);

// ─── GET /dashboard ──────────────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const influencer = await getInfluencerForUser(userId);
  if (!influencer) {
    return res.json({ success: true, data: { stats: { activeCampaigns: 0, briefsToAccept: 0, pendingReview: 0, approvedContent: 0, urgentDeadlines: 0 }, upcomingDeadlines: [] } });
  }

  const assignments = await prisma.campaignInfluencer.findMany({
    where: {
      influencerId: influencer.influencerId,
      campaign: {
        status: { in: ['proposed', 'approved', 'contracted', 'in_review', 'pitching', 'live'] },
        isDeleted: false,
      }
    },
    include: {
      campaign: { select: { campaignName: true, endDate: true } },
      content: { select: { approvalStatus: true } },
    }
  });

  const activeCampaigns = assignments.length;
  const briefsToAccept = assignments.filter(a =>
    (a.status === 'contracted' || a.status === 'approved') && !a.briefAccepted
  ).length;
  const pendingReview = assignments.reduce((sum, a) =>
    sum + a.content.filter(c => c.approvalStatus === 'pending' || c.approvalStatus === 'internal_approved').length, 0);
  const approvedContent = assignments.reduce((sum, a) =>
    sum + a.content.filter(c => c.approvalStatus === 'client_approved').length, 0);

  // Upcoming deadlines
  const now = new Date();
  const upcomingDeadlines = assignments
    .filter(a => a.campaign.endDate && new Date(a.campaign.endDate) > now)
    .map(a => ({
      campaignName: a.campaign.campaignName,
      type: !a.briefAccepted ? 'brief_acceptance' : 'content_submission',
      dueDate: a.campaign.endDate,
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const urgentDeadlines = upcomingDeadlines.filter(d => {
    const daysLeft = (new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 3;
  }).length;

  return res.json({
    success: true,
    data: {
      stats: { activeCampaigns, briefsToAccept, pendingReview, approvedContent, urgentDeadlines },
      upcomingDeadlines,
    }
  });
}));

// ─── GET /campaigns ──────────────────────────────────────────────────────────
router.get('/campaigns', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const influencer = await getInfluencerForUser(userId);
  if (!influencer) {
    return res.json({ success: true, data: { campaigns: [], count: 0 } });
  }

  const assignments = await prisma.campaignInfluencer.findMany({
    where: {
      influencerId: influencer.influencerId,
      campaign: {
        status: { in: ['proposed', 'approved', 'contracted', 'in_review', 'pitching', 'live'] },
        isDeleted: false,
      }
    },
    include: {
      campaign: {
        select: {
          campaignId: true, displayId: true, campaignName: true,
          status: true, startDate: true, endDate: true,
        }
      },
      content: { select: { approvalStatus: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const campaigns = assignments.map(a => ({
    id: a.campaign.campaignId,
    displayId: a.campaign.displayId,
    name: a.campaign.campaignName,
    status: a.campaign.status,
    assignment: {
      id: a.id,
      status: a.status,
      briefAccepted: a.briefAccepted,
      briefAcceptedAt: a.briefAcceptedAt,
      agreedCost: a.agreedCost,
      contentSubmitted: a.content.length,
      contentApproved: a.content.filter(c => c.approvalStatus === 'client_approved').length,
      contentPending: a.content.filter(c => c.approvalStatus === 'pending' || c.approvalStatus === 'internal_approved').length,
    },
    startDate: a.campaign.startDate,
    endDate: a.campaign.endDate,
  }));

  return res.json({ success: true, data: { campaigns, count: campaigns.length } });
}));

// ─── GET /campaigns/:campaignId ──────────────────────────────────────────────
router.get('/campaigns/:campaignId', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const influencer = await getInfluencerForUser(userId);
  if (!influencer) {
    return res.status(403).json({ success: false, error: 'Influencer profile not found' });
  }

  const assignment = await verifyAssignment(influencer.influencerId, campaignId);
  if (!assignment) {
    return res.status(403).json({ success: false, error: 'You are not assigned to this campaign' });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { campaignId, isDeleted: false },
    include: {
      briefs: { orderBy: { version: 'desc' }, take: 1 },
      invoices: {
        where: {
          OR: [
            { campaignInfluencerId: assignment.id },
            { campaignInfluencerId: null }
          ]
        },
        select: { id: true, invoiceType: true, status: true, amount: true, createdAt: true }
      },
    }
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  // Get content for this assignment
  const content = await prisma.content.findMany({
    where: { collaborationId: assignment.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, type: true, version: true, approvalStatus: true,
      fileName: true, fileUrl: true, internalFeedback: true,
      clientFeedback: true, createdAt: true, updatedAt: true,
    }
  });

  const brief = campaign.briefs[0] || null;

  return res.json({
    success: true,
    data: {
      id: campaign.campaignId,
      displayId: campaign.displayId,
      name: campaign.campaignName,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      assignment: {
        id: assignment.id,
        status: assignment.status,
        briefAccepted: assignment.briefAccepted,
        briefAcceptedAt: assignment.briefAcceptedAt,
        agreedCost: assignment.agreedCost,
        agreedDeliverables: assignment.agreedDeliverables,
      },
      brief: brief ? {
        objectives: brief.objectives,
        deliverables: brief.deliverables,
        keyMessages: brief.keyMessages,
        targetAudience: brief.targetAudience,
      } : null,
      content,
      payments: campaign.invoices,
    }
  });
}));

// ─── POST /campaigns/:campaignId/brief/accept ────────────────────────────────
router.post('/campaigns/:campaignId/brief/accept', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const influencer = await getInfluencerForUser(userId);
  if (!influencer) {
    return res.status(403).json({ success: false, error: 'Influencer profile not found' });
  }

  const assignment = await verifyAssignment(influencer.influencerId, campaignId);
  if (!assignment) {
    return res.status(403).json({ success: false, error: 'You are not assigned to this campaign' });
  }

  if (assignment.briefAccepted) {
    return res.status(400).json({ success: false, error: 'Brief has already been accepted' });
  }

  if (assignment.status !== 'contracted' && assignment.status !== 'approved') {
    return res.status(400).json({ success: false, error: 'You must be in contracted status to accept a brief' });
  }

  const updated = await prisma.campaignInfluencer.update({
    where: { id: assignment.id },
    data: {
      briefAccepted: true,
      briefAcceptedAt: new Date(),
      status: 'brief_accepted',
    }
  });

  return res.json({
    success: true,
    data: {
      id: updated.id,
      briefAccepted: true,
      briefAcceptedAt: updated.briefAcceptedAt,
      status: 'brief_accepted',
      message: 'Brief accepted. You can now submit content.',
    }
  });
}));

// ─── POST /campaigns/:campaignId/content ─────────────────────────────────────
router.post('/campaigns/:campaignId/content', upload.single('file'), asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const { type } = req.body;
  const influencer = await getInfluencerForUser(userId);
  if (!influencer) {
    return res.status(403).json({ success: false, error: 'Influencer profile not found' });
  }

  const assignment = await verifyAssignment(influencer.influencerId, campaignId);
  if (!assignment) {
    return res.status(403).json({ success: false, error: 'You are not assigned to this campaign' });
  }

  if (!assignment.briefAccepted) {
    return res.status(400).json({ success: false, error: 'You must accept the brief before submitting content' });
  }

  const validTypes = ['script', 'draft', 'final', 'video_draft'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ success: false, error: `type must be one of: ${validTypes.join(', ')}` });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'File is required' });
  }

  // Calculate next version number for this type
  const existingCount = await prisma.content.count({
    where: { collaborationId: assignment.id, type }
  });

  const content = await prisma.content.create({
    data: {
      campaignId,
      collaborationId: assignment.id,
      type,
      version: existingCount + 1,
      approvalStatus: 'pending',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSizeBytes: req.file.size,
    }
  });

  return res.status(201).json({
    success: true,
    data: {
      id: content.id,
      campaignId: content.campaignId,
      campaignInfluencerId: assignment.id,
      type: content.type,
      versionNumber: content.version,
      approvalStatus: content.approvalStatus,
      fileName: content.fileName,
      fileUrl: content.fileUrl,
      fileSizeBytes: content.fileSizeBytes,
      createdAt: content.createdAt,
    }
  });
}));

// ─── GET /campaigns/:campaignId/content ──────────────────────────────────────
router.get('/campaigns/:campaignId/content', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const influencer = await getInfluencerForUser(userId);
  if (!influencer) {
    return res.status(403).json({ success: false, error: 'Influencer profile not found' });
  }

  const assignment = await verifyAssignment(influencer.influencerId, campaignId);
  if (!assignment) {
    return res.status(403).json({ success: false, error: 'You are not assigned to this campaign' });
  }

  const content = await prisma.content.findMany({
    where: { collaborationId: assignment.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, type: true, version: true, approvalStatus: true,
      fileName: true, fileUrl: true, internalFeedback: true,
      clientFeedback: true, createdAt: true, updatedAt: true,
    }
  });

  return res.json({
    success: true,
    data: {
      content,
      count: content.length,
    }
  });
}));

// ─── POST /campaigns/:campaignId/deliverable-adjustment ──────────────────────
router.post('/campaigns/:campaignId/deliverable-adjustment', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const { adjustmentType, currentValue, requestedValue, reason } = req.body;
  const influencer = await getInfluencerForUser(userId);
  if (!influencer) {
    return res.status(403).json({ success: false, error: 'Influencer profile not found' });
  }

  const assignment = await verifyAssignment(influencer.influencerId, campaignId);
  if (!assignment) {
    return res.status(403).json({ success: false, error: 'You are not assigned to this campaign' });
  }

  if (!adjustmentType || !['timeline', 'rate'].includes(adjustmentType)) {
    return res.status(400).json({ success: false, error: 'adjustmentType must be one of: timeline, rate' });
  }

  if (!requestedValue) {
    return res.status(400).json({ success: false, error: 'requestedValue is required' });
  }

  if (!reason) {
    return res.status(400).json({ success: false, error: 'reason is required for adjustment requests' });
  }

  // Find campaign owner/manager to notify
  const campaign = await prisma.campaign.findUnique({
    where: { campaignId },
    select: { ownerId: true, campaignName: true }
  });

  // Create notification for Director/CM
  const notification = await prisma.notification.create({
    data: {
      userId: campaign?.ownerId || userId, // notify campaign owner
      campaignId,
      notificationType: 'deliverable_adjustment',
      category: 'campaign',
      title: 'Deliverable Adjustment Request',
      message: `${influencer.displayName} requested a ${adjustmentType} adjustment for ${campaign?.campaignName || 'campaign'}: ${reason}`,
      metadata: JSON.stringify({ adjustmentType, currentValue, requestedValue, reason, campaignInfluencerId: assignment.id }),
      priority: 'high',
    }
  });

  return res.status(201).json({
    success: true,
    data: {
      id: notification.notificationId,
      campaignInfluencerId: assignment.id,
      adjustmentType,
      requestedValue,
      reason,
      message: 'Adjustment request submitted. Campaign Manager has been notified.',
      createdAt: notification.createdAt,
    }
  });
}));

module.exports = router;
