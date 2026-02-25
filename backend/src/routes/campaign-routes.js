// Campaign Management Routes — Phase 3 V2 Lifecycle
// T019-T023: Enhanced creation, status transitions, risk, optimistic concurrency, soft-delete
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const asyncHandler = require('../middleware/async-handler');
const { validateTransition, CAMPAIGN_STATUS_TRANSITIONS, createStatusValidator } = require('../utils/status-transition-helper');
const { generateCampaignId } = require('../services/id-generator-service');
const { calculateRisk } = require('../services/risk-scoring-service');

const prisma = new PrismaClient();
const canTransitionStatus = createStatusValidator(CAMPAIGN_STATUS_TRANSITIONS);

// Status → Phase mapping
const STATUS_TO_PHASE = {
  draft: 'brief_intake',
  in_review: 'budget_review',
  pitching: 'client_pitching',
  live: 'content_production',
  reporting: 'report_generation',
  closed: 'closure',
};

// Helper: check if user has a specific role (supports V2 roles array + legacy role string)
function userHasRole(req, roleName) {
  const roles = req.user?.roles;
  if (Array.isArray(roles)) {
    if (roles.some(r => (r.role || r) === roleName)) return true;
  }
  const legacy = req.user?.role;
  if (legacy === roleName) return true;
  if (roleName === 'director' && legacy === 'admin') return true;
  return false;
}

// Create CRUD factory for GET list, GET detail, PUT update (backward compat)
const crudRouter = createCrudRouter({
  prisma,
  modelName: 'campaign',
  idField: 'campaignId',
  listFilters: {
    status: 'status',
    clientId: 'clientId',
  },
  includeRelations: {
    list: {
      client: {
        select: {
          clientId: true,
          brandDisplayName: true,
          legalCompanyName: true,
          displayId: true,
        },
      },
      owner: {
        select: { userId: true, displayName: true, fullName: true },
      },
    },
    detail: {
      client: true,
      owner: { select: { userId: true, displayName: true, fullName: true } },
      campaignInfluencers: {
        include: {
          influencer: {
            select: {
              influencerId: true,
              displayName: true,
              fullName: true,
            },
          },
        },
      },
    },
    default: {
      client: true,
    },
  },
  beforeCreate: (data) => {
    return { ...data, status: data.status || 'draft' };
  },
  beforeUpdate: async (id, data, existingEntity, req, res) => {
    if (data.status && existingEntity && data.status !== existingEntity.status) {
      if (!canTransitionStatus(existingEntity.status, data.status)) {
        res.status(400).json({
          success: false,
          error: `Cannot transition campaign from ${existingEntity.status} to ${data.status}`,
          allowedTransitions: CAMPAIGN_STATUS_TRANSITIONS[existingEntity.status],
        });
        return;
      }
    }
    return data;
  },
});

// ─── Main router ─────────────────────────────────────────────────────────────
const router = express.Router();

// Apply authentication to all routes
router.use(requireAuthentication);

// ── T019: Enhanced campaign creation (3 modes) ──────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const {
    mode, name, clientId, budget, managementFee,
    startDate, endDate, description, briefText, briefFileUrl,
  } = req.body;

  // Validate mode
  if (!mode || !['brief', 'wizard', 'quick'].includes(mode)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid mode. Must be brief, wizard, or quick',
    });
  }

  // Mode-specific validation
  if (mode === 'brief' && !briefText && !briefFileUrl) {
    return res.status(400).json({
      success: false,
      error: 'Brief mode requires briefText or briefFileUrl',
    });
  }
  if ((mode === 'wizard' || mode === 'quick') && !name) {
    return res.status(400).json({
      success: false,
      error: `${mode} mode requires a campaign name`,
    });
  }

  // Generate TKT-YYYY-XXXX display ID
  const displayId = await generateCampaignId();

  // Build campaign data
  const campaignData = {
    campaignName: name || 'Untitled Campaign',
    campaignDescription: description || null,
    displayId,
    status: 'draft',
    phase: 'brief_intake',
    managementFee: managementFee != null ? managementFee : 30,
    totalBudget: budget != null ? budget : null,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    clientId: clientId || null,
    ownerId: req.user?.userId || null,
  };

  // Auto-calculate initial risk score
  const risk = calculateRisk(campaignData);
  campaignData.riskScore = risk.score;
  campaignData.riskLevel = risk.level;

  const campaign = await prisma.campaign.create({
    data: campaignData,
    include: {
      client: true,
      owner: { select: { userId: true, displayName: true, fullName: true } },
    },
  });

  // If brief mode, also create a brief record
  if (mode === 'brief') {
    await prisma.brief.create({
      data: {
        campaignId: campaign.campaignId,
        rawText: briefText || null,
        fileUrl: briefFileUrl || null,
      },
    });
  }

  return res.status(201).json({
    success: true,
    data: campaign,
  });
}));

// ── T023: Soft-delete (draft only, Director/CM only) ─────────────────────────
router.delete('/:id', asyncHandler(async (req, res) => {
  const campaign = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const canDelete = userHasRole(req, 'director') || userHasRole(req, 'campaign_manager');
  if (!canDelete) {
    return res.status(403).json({
      success: false,
      error: 'Only Director or Campaign Manager can delete campaigns',
    });
  }

  if (campaign.status !== 'draft') {
    return res.status(400).json({
      success: false,
      error: 'Only draft campaigns can be deleted',
    });
  }

  await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: { isDeleted: true },
  });

  return res.json({
    success: true,
    data: { message: 'Campaign soft-deleted', id: campaign.campaignId },
  });
}));

// ── T022: PATCH with optimistic concurrency ──────────────────────────────────
router.patch('/:id', asyncHandler(async (req, res) => {
  const { version, name, description, clientId, budget, managementFee, startDate, endDate } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({
      success: false,
      error: 'version is required for optimistic concurrency',
    });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  if (campaign.status === 'closed') {
    return res.status(400).json({
      success: false,
      error: 'Cannot modify a closed campaign',
    });
  }

  if (campaign.version !== version) {
    return res.status(409).json({
      success: false,
      error: `Conflict: campaign has been modified. Your version: ${version}, current version: ${campaign.version}. Please refresh and retry.`,
      data: { currentVersion: campaign.version, serverData: campaign },
    });
  }

  const updateData = {};
  if (name !== undefined) updateData.campaignName = name;
  if (description !== undefined) updateData.campaignDescription = description;
  if (clientId !== undefined) updateData.clientId = clientId;
  if (budget !== undefined) updateData.totalBudget = budget;
  if (managementFee !== undefined) updateData.managementFee = managementFee;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

  // Track budget revision
  if (budget !== undefined && budget !== campaign.totalBudget) {
    await prisma.budgetRevision.create({
      data: {
        campaignId: campaign.campaignId,
        previousBudget: campaign.totalBudget || 0,
        newBudget: budget,
        changedBy: req.user?.userId || 'unknown',
      },
    });
  }

  // Recalculate risk score
  const mergedCampaign = { ...campaign, ...updateData };
  const risk = calculateRisk(mergedCampaign);
  updateData.riskScore = risk.score;
  updateData.riskLevel = risk.level;

  // Increment version
  updateData.version = campaign.version + 1;

  const updatedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: updateData,
    include: { client: true },
  });

  return res.json({
    success: true,
    data: updatedCampaign,
  });
}));

// ── T020: Status transition endpoint ─────────────────────────────────────────
router.post('/:id/status', asyncHandler(async (req, res) => {
  const { targetStatus, newStatus, overrideReason } = req.body;
  const target = targetStatus || newStatus;

  if (!target) {
    return res.status(400).json({ success: false, error: 'targetStatus is required' });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  // High-risk check: score 5+ going to in_review requires Director or overrideReason
  if (campaign.riskScore >= 5 && target === 'in_review') {
    const isDirector = userHasRole(req, 'director');
    if (!isDirector && !overrideReason) {
      return res.status(403).json({
        success: false,
        error: 'High-risk campaign requires Director override with reason',
      });
    }
  }

  // Validate transition via status-transition-helper
  const validation = await validateTransition(campaign, target, {
    userId: req.user?.userId,
  });

  if (!validation.allowed) {
    return res.status(400).json({
      success: false,
      error: validation.reason,
      data: { unmet: validation.missingRequirements },
    });
  }

  const previousStatus = campaign.status;
  const newPhase = STATUS_TO_PHASE[target] || campaign.phase;

  const updateData = {
    status: target,
    phase: newPhase,
    version: { increment: 1 },
  };

  if (target === 'closed') {
    updateData.closedAt = new Date();
  }

  const updatedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: updateData,
    include: { client: true },
  });

  // Record high-risk override approval
  if (overrideReason && campaign.riskScore >= 5) {
    await prisma.approval.create({
      data: {
        campaignId: campaign.campaignId,
        type: 'high_risk_override',
        status: 'approved',
        approvedBy: req.user?.userId,
        reason: overrideReason,
      },
    });
  }

  return res.json({
    success: true,
    data: {
      id: updatedCampaign.campaignId,
      previousStatus,
      newStatus: target,
      phase: updatedCampaign.phase,
      version: updatedCampaign.version,
      updatedAt: updatedCampaign.updatedAt,
    },
  });
}));

// ── T021: Risk assessment endpoint ───────────────────────────────────────────
router.get('/:id/risk', asyncHandler(async (req, res) => {
  const campaign = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const risk = calculateRisk(campaign);

  return res.json({
    success: true,
    data: {
      campaignId: campaign.campaignId,
      riskScore: risk.score,
      riskLevel: risk.level,
      factors: risk.breakdown,
      requiresDirectorOverride: risk.score >= 5,
      campaign: {
        id: campaign.campaignId,
        displayId: campaign.displayId,
        campaignName: campaign.campaignName,
      },
    },
  });
}));

// ── Mount CRUD factory (GET list, GET detail, PUT update) ────────────────────
router.use('/', crudRouter);

// ── Existing lifecycle aliases (backward compatible) ─────────────────────────

router.post('/:id/activate', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaignRecord) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  if (!canTransitionStatus(campaignRecord.status, 'live')) {
    return res.status(400).json({
      success: false,
      error: `Cannot activate campaign with status ${campaignRecord.status}`,
      currentStatus: campaignRecord.status,
    });
  }

  const activatedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: {
      status: 'live',
      phase: STATUS_TO_PHASE['live'],
      launchDate: campaignRecord.launchDate || new Date(),
      version: { increment: 1 },
    },
    include: { client: true },
  });

  res.json({
    success: true,
    data: activatedCampaign,
    message: 'Campaign activated successfully',
  });
}));

router.post('/:id/pause', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaignRecord) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  if (campaignRecord.status !== 'live') {
    return res.status(400).json({
      success: false,
      error: `Can only pause a live campaign, current status is ${campaignRecord.status}`,
      currentStatus: campaignRecord.status,
    });
  }

  const pausedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: {
      status: 'paused',
      version: { increment: 1 },
    },
    include: { client: true },
  });

  res.json({
    success: true,
    data: pausedCampaign,
    message: 'Campaign paused successfully',
  });
}));

router.post('/:id/resume', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaignRecord) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  if (campaignRecord.status !== 'paused') {
    return res.status(400).json({
      success: false,
      error: 'Only paused campaigns can be resumed',
      currentStatus: campaignRecord.status,
    });
  }

  const resumedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: {
      status: 'live',
      phase: STATUS_TO_PHASE['live'],
      version: { increment: 1 },
    },
    include: { client: true },
  });

  res.json({
    success: true,
    data: resumedCampaign,
    message: 'Campaign resumed successfully',
  });
}));

router.post('/:id/complete', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaignRecord) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  if (campaignRecord.status !== 'reporting') {
    return res.status(400).json({
      success: false,
      error: `Can only complete a campaign in reporting status, current status is ${campaignRecord.status}`,
      currentStatus: campaignRecord.status,
    });
  }

  const completedCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: {
      status: 'closed',
      phase: STATUS_TO_PHASE['closed'],
      closedAt: new Date(),
      endDate: campaignRecord.endDate || new Date(),
      version: { increment: 1 },
    },
    include: { client: true },
  });

  res.json({
    success: true,
    data: completedCampaign,
    message: 'Campaign completed successfully',
  });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
  });

  if (!campaignRecord) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  if (!canTransitionStatus(campaignRecord.status, 'cancelled')) {
    return res.status(400).json({
      success: false,
      error: `Cannot cancel campaign with status ${campaignRecord.status}`,
      currentStatus: campaignRecord.status,
    });
  }

  const { reason } = req.body;

  const cancelledCampaign = await prisma.campaign.update({
    where: { campaignId: req.params.id },
    data: {
      status: 'cancelled',
      version: { increment: 1 },
    },
    include: { client: true },
  });

  res.json({
    success: true,
    data: cancelledCampaign,
    message: 'Campaign cancelled successfully',
    reason: reason || 'No reason provided',
  });
}));

router.get('/:id/budget', asyncHandler(async (req, res) => {
  const campaignRecord = await prisma.campaign.findUnique({
    where: { campaignId: req.params.id },
    select: {
      campaignId: true,
      campaignName: true,
      totalBudget: true,
      allocatedBudget: true,
      spentBudget: true,
      status: true,
    },
  });

  if (!campaignRecord) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const budgetRemaining = (campaignRecord.totalBudget || 0) - (campaignRecord.spentBudget || 0);
  const budgetUtilization =
    campaignRecord.totalBudget > 0
      ? ((campaignRecord.spentBudget || 0) / campaignRecord.totalBudget * 100).toFixed(2)
      : 0;

  res.json({
    success: true,
    data: {
      ...campaignRecord,
      budgetRemaining,
      budgetUtilization: parseFloat(budgetUtilization),
    },
  });
}));

module.exports = router;
