// T085: Client Portal Routes — scoped to campaigns assigned to the authenticated client user
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const asyncHandler = require('../middleware/async-handler');

const prisma = new PrismaClient();
const router = express.Router();

// ─── Middleware: require client role ────────────────────────────────────────
function requireClientRole(req, res, next) {
  const legacyRole = req.authenticatedUser?.role;
  // Check V2 roles from UserRole table (async)
  prisma.userRole.count({
    where: { userId: req.authenticatedUser.userId, role: 'client' }
  }).then((count) => {
    if (count > 0 || legacyRole === 'client') return next();
    return res.status(403).json({
      success: false,
      error: 'Client role required to access this resource'
    });
  }).catch(() => {
    return res.status(500).json({ success: false, error: 'Failed to verify role' });
  });
}

// Helper: get campaign IDs assigned to this client user
async function getAssignedCampaignIds(userId, statusFilter) {
  const where = { clientUserId: userId };
  if (statusFilter) {
    where.campaign = { status: { in: statusFilter }, isDeleted: false };
  } else {
    where.campaign = { isDeleted: false };
  }
  const assignments = await prisma.campaignClientAssignment.findMany({
    where,
    select: { campaignId: true }
  });
  return assignments.map(a => a.campaignId);
}

// Helper: verify client is assigned to campaign
async function verifyClientAssignment(userId, campaignId) {
  const assignment = await prisma.campaignClientAssignment.findFirst({
    where: { clientUserId: userId, campaignId }
  });
  return !!assignment;
}

// Apply auth to all routes
router.use(requireAuthentication);
router.use(requireClientRole);

// ─── GET /dashboard ─────────────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const campaignIds = await getAssignedCampaignIds(userId, ['pitching', 'live']);

  // Stats
  const campaigns = await prisma.campaign.findMany({
    where: { campaignId: { in: campaignIds }, isDeleted: false },
    include: {
      campaignInfluencers: { select: { id: true } },
      content: { where: { approvalStatus: { in: ['pending', 'internal_approved'] } }, select: { id: true } },
      approvals: { where: { status: 'pending', type: 'shortlist' }, select: { id: true } },
      reports: { where: { status: 'pending_approval' }, select: { id: true } },
    }
  });

  const activeCampaigns = campaigns.length;
  const pendingApprovals = campaigns.reduce((sum, c) =>
    sum + c.approvals.length + c.content.length + c.reports.length, 0);
  const contractedCreators = campaigns.reduce((sum, c) => sum + c.campaignInfluencers.length, 0);
  const reportsReady = campaigns.reduce((sum, c) => sum + c.reports.length, 0);

  // Consolidated KPIs
  const kpiAgg = await prisma.kPI.aggregate({
    where: { campaignId: { in: campaignIds } },
    _sum: { reach: true, impressions: true, engagement: true, clicks: true }
  });

  const totalReach = kpiAgg._sum.reach || 0;

  // Recent activity (notifications for this user's campaigns)
  const recentActivity = await prisma.notification.findMany({
    where: { campaignId: { in: campaignIds } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      notificationType: true,
      message: true,
      createdAt: true,
      campaign: { select: { campaignName: true } }
    }
  });

  return res.json({
    success: true,
    data: {
      stats: {
        activeCampaigns,
        pendingApprovals,
        contractedCreators,
        reportsReady,
        totalReach,
      },
      consolidatedKpis: {
        totalReach,
        totalImpressions: kpiAgg._sum.impressions || 0,
        totalEngagement: kpiAgg._sum.engagement || 0,
        totalClicks: kpiAgg._sum.clicks || 0,
      },
      recentActivity: recentActivity.map(n => ({
        type: n.notificationType,
        campaignName: n.campaign?.campaignName || '',
        message: n.message,
        createdAt: n.createdAt,
      })),
    }
  });
}));

// ─── GET /campaigns ─────────────────────────────────────────────────────────
router.get('/campaigns', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { status } = req.query;

  const statusFilter = status
    ? [status]
    : ['pitching', 'live'];

  const campaignIds = await getAssignedCampaignIds(userId, statusFilter);

  const campaigns = await prisma.campaign.findMany({
    where: { campaignId: { in: campaignIds }, status: { in: statusFilter }, isDeleted: false },
    include: {
      campaignInfluencers: { select: { id: true } },
      approvals: { where: { status: 'pending' }, select: { id: true } },
      kpis: { select: { reach: true, impressions: true, engagement: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const result = campaigns.map(c => ({
    id: c.campaignId,
    displayId: c.displayId,
    name: c.campaignName,
    status: c.status,
    startDate: c.startDate,
    endDate: c.endDate,
    influencerCount: c.campaignInfluencers.length,
    pendingApprovals: c.approvals.length,
    kpiSummary: {
      totalReach: c.kpis.reduce((s, k) => s + (k.reach || 0), 0),
      totalImpressions: c.kpis.reduce((s, k) => s + (k.impressions || 0), 0),
      totalEngagement: c.kpis.reduce((s, k) => s + (k.engagement || 0), 0),
    }
  }));

  return res.json({ success: true, data: { campaigns: result, count: result.length } });
}));

// ─── GET /campaigns/:campaignId ─────────────────────────────────────────────
router.get('/campaigns/:campaignId', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;

  const isAssigned = await verifyClientAssignment(userId, campaignId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, error: 'You are not authorized to view this campaign' });
  }

  const campaign = await prisma.campaign.findFirst({
    where: { campaignId, isDeleted: false },
    include: {
      campaignInfluencers: {
        include: {
          influencer: {
            select: {
              influencerId: true, handle: true, displayName: true, platform: true,
              followerCount: true, profileImageUrl: true,
            }
          },
          content: {
            select: {
              id: true, type: true, approvalStatus: true, fileName: true,
              fileUrl: true, clientFeedback: true, createdAt: true,
            }
          },
          kpis: {
            select: { reach: true, impressions: true, engagement: true, clicks: true }
          },
        }
      },
      reports: { orderBy: { createdAt: 'desc' }, take: 1 },
      approvals: { where: { type: 'shortlist' } },
      kpis: { select: { reach: true, impressions: true, engagement: true, clicks: true } },
    }
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const influencers = campaign.campaignInfluencers.map(ci => ({
    id: ci.id,
    handle: ci.influencer.handle,
    displayName: ci.influencer.displayName,
    platform: ci.influencer.platform,
    followers: ci.influencer.followerCount,
    profileImageUrl: ci.influencer.profileImageUrl,
    aiScore: ci.aiMatchScore,
    status: ci.status,
    agreedCost: ci.agreedCost,
    content: ci.content,
    kpis: {
      reach: ci.kpis.reduce((s, k) => s + (k.reach || 0), 0),
      impressions: ci.kpis.reduce((s, k) => s + (k.impressions || 0), 0),
      engagement: ci.kpis.reduce((s, k) => s + (k.engagement || 0), 0),
      clicks: ci.kpis.reduce((s, k) => s + (k.clicks || 0), 0),
    }
  }));

  return res.json({
    success: true,
    data: {
      id: campaign.campaignId,
      displayId: campaign.displayId,
      name: campaign.campaignName,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      totalBudget: campaign.totalBudget,
      influencers,
      shortlistApproval: campaign.approvals[0] || null,
      report: campaign.reports[0] || null,
      kpiSummary: {
        totalReach: campaign.kpis.reduce((s, k) => s + (k.reach || 0), 0),
        totalImpressions: campaign.kpis.reduce((s, k) => s + (k.impressions || 0), 0),
        totalEngagement: campaign.kpis.reduce((s, k) => s + (k.engagement || 0), 0),
        totalClicks: campaign.kpis.reduce((s, k) => s + (k.clicks || 0), 0),
      }
    }
  });
}));

// ─── POST /campaigns/:campaignId/shortlist/approve ──────────────────────────
router.post('/campaigns/:campaignId/shortlist/approve', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const { feedback } = req.body;

  const isAssigned = await verifyClientAssignment(userId, campaignId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, error: 'You are not authorized to approve this shortlist' });
  }

  // Find or create shortlist approval
  let approval = await prisma.approval.findFirst({
    where: { campaignId, type: 'shortlist', status: 'pending' }
  });

  if (!approval) {
    approval = await prisma.approval.create({
      data: { campaignId, type: 'shortlist', status: 'pending' }
    });
  }

  const updated = await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: 'approved',
      approvedBy: userId,
      reason: feedback || null,
    }
  });

  // Transition campaign to live if in pitching status
  const campaign = await prisma.campaign.findUnique({ where: { campaignId } });
  if (campaign && campaign.status === 'pitching') {
    await prisma.campaign.update({
      where: { campaignId },
      data: { status: 'live', version: { increment: 1 } }
    });
  }

  return res.json({
    success: true,
    data: {
      id: updated.id,
      status: 'approved',
      approvedBy: userId,
      message: 'Shortlist approved. Campaign can now advance to live.',
      updatedAt: updated.updatedAt,
    }
  });
}));

// ─── POST /campaigns/:campaignId/shortlist/reject ───────────────────────────
router.post('/campaigns/:campaignId/shortlist/reject', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, error: 'reason is required when rejecting a shortlist' });
  }

  const isAssigned = await verifyClientAssignment(userId, campaignId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, error: 'You are not authorized to reject this shortlist' });
  }

  let approval = await prisma.approval.findFirst({
    where: { campaignId, type: 'shortlist', status: 'pending' }
  });

  if (!approval) {
    approval = await prisma.approval.create({
      data: { campaignId, type: 'shortlist', status: 'pending' }
    });
  }

  const updated = await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: 'rejected',
      rejectedBy: userId,
      reason,
    }
  });

  return res.json({
    success: true,
    data: {
      id: updated.id,
      status: 'rejected',
      rejectedBy: userId,
      reason,
      message: 'Shortlist rejected. Campaign Manager has been notified.',
      updatedAt: updated.updatedAt,
    }
  });
}));

// ─── POST /campaigns/:campaignId/content/:contentId/approve ─────────────────
router.post('/campaigns/:campaignId/content/:contentId/approve', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId, contentId } = req.params;
  const { feedback } = req.body;

  const isAssigned = await verifyClientAssignment(userId, campaignId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, error: 'You are not authorized to approve this content' });
  }

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content || content.campaignId !== campaignId) {
    return res.status(404).json({ success: false, error: 'Content not found in this campaign' });
  }

  if (content.approvalStatus !== 'internal_approved') {
    return res.status(400).json({ success: false, error: 'Content must be internally approved before client approval' });
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: {
      approvalStatus: 'client_approved',
      clientFeedback: feedback || null,
      postingBlocked: content.type === 'final' ? false : content.postingBlocked,
    }
  });

  return res.json({
    success: true,
    data: {
      id: updated.id,
      approvalStatus: 'client_approved',
      postingBlocked: updated.postingBlocked,
      clientFeedback: updated.clientFeedback,
      updatedAt: updated.updatedAt,
    }
  });
}));

// ─── POST /campaigns/:campaignId/content/:contentId/request-changes ─────────
router.post('/campaigns/:campaignId/content/:contentId/request-changes', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId, contentId } = req.params;
  const { feedback } = req.body;

  if (!feedback) {
    return res.status(400).json({ success: false, error: 'feedback is required when requesting changes' });
  }

  const isAssigned = await verifyClientAssignment(userId, campaignId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, error: 'You are not authorized to request changes for this content' });
  }

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content || content.campaignId !== campaignId) {
    return res.status(404).json({ success: false, error: 'Content not found in this campaign' });
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: {
      approvalStatus: 'changes_requested',
      clientFeedback: feedback,
    }
  });

  return res.json({
    success: true,
    data: {
      id: updated.id,
      approvalStatus: 'changes_requested',
      clientFeedback: updated.clientFeedback,
      updatedAt: updated.updatedAt,
    }
  });
}));

// ─── POST /campaigns/:campaignId/report/approve ─────────────────────────────
router.post('/campaigns/:campaignId/report/approve', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;
  const { feedback } = req.body;

  const isAssigned = await verifyClientAssignment(userId, campaignId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, error: 'You are not authorized to approve this report' });
  }

  const report = await prisma.report.findFirst({
    where: { campaignId },
    orderBy: { createdAt: 'desc' }
  });

  if (!report) {
    return res.status(404).json({ success: false, error: 'No report found for this campaign' });
  }

  if (report.status !== 'pending_approval') {
    return res.status(400).json({ success: false, error: 'Report must be in pending_approval status' });
  }

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      status: 'approved',
      approvedBy: userId,
      approvedAt: new Date(),
    }
  });

  return res.json({
    success: true,
    data: {
      id: updated.id,
      status: 'approved',
      approvedBy: userId,
      approvedAt: updated.approvedAt,
    }
  });
}));

// ─── GET /campaigns/:campaignId/report ──────────────────────────────────────
router.get('/campaigns/:campaignId/report', asyncHandler(async (req, res) => {
  const userId = req.authenticatedUser.userId;
  const { campaignId } = req.params;

  const isAssigned = await verifyClientAssignment(userId, campaignId);
  if (!isAssigned) {
    return res.status(403).json({ success: false, error: 'You are not authorized to view this report' });
  }

  const report = await prisma.report.findFirst({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    include: {
      campaign: { select: { campaignId: true, displayId: true, campaignName: true } }
    }
  });

  if (!report) {
    return res.status(404).json({ success: false, error: 'No report found for this campaign' });
  }

  return res.json({
    success: true,
    data: report,
  });
}));

module.exports = router;
