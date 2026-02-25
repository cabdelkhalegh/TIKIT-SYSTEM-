/**
 * Campaign Status Transition Helper (V2)
 * Validates 8-stage campaign lifecycle gates per Constitution Section IV and R-001
 *
 * Gates:
 *   draft → in_review: brief must exist and be reviewed
 *   in_review → pitching: Director budget approval required
 *   pitching → live: client shortlist approval required
 *   live → reporting: all campaign influencers must have livePostUrl set
 *   reporting → closed: report client-approved + all invoices status=paid
 *   Any → paused: only from live
 *   Any → cancelled: allowed from draft/in_review/pitching/live/reporting
 *   closed: immutable, no transitions
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Validate whether a campaign can transition to a target status
 * @param {Object} campaign - Full campaign object (with relations if needed)
 * @param {string} targetStatus - The target CampaignStatus enum value
 * @param {Object} context - Additional context (e.g., userId, userRoles)
 * @returns {{ allowed: boolean, reason: string, missingRequirements: string[] }}
 */
async function validateTransition(campaign, targetStatus, context = {}) {
  const currentStatus = campaign.status;
  const missingRequirements = [];

  // Closed campaigns are immutable — no transitions allowed
  if (currentStatus === 'closed') {
    return {
      allowed: false,
      reason: 'Campaign is closed and immutable. No status changes permitted.',
      missingRequirements: ['Campaign is permanently closed'],
    };
  }

  // Handle paused transition
  if (targetStatus === 'paused') {
    if (currentStatus !== 'live') {
      return {
        allowed: false,
        reason: 'Campaigns can only be paused from live status.',
        missingRequirements: [`Current status is '${currentStatus}', must be 'live'`],
      };
    }
    return { allowed: true, reason: 'Campaign can be paused from live.', missingRequirements: [] };
  }

  // Handle cancelled transition
  if (targetStatus === 'cancelled') {
    const cancellableStatuses = ['draft', 'in_review', 'pitching', 'live', 'reporting'];
    if (!cancellableStatuses.includes(currentStatus)) {
      return {
        allowed: false,
        reason: `Cannot cancel a campaign in '${currentStatus}' status.`,
        missingRequirements: [`Status '${currentStatus}' is not cancellable`],
      };
    }
    return { allowed: true, reason: 'Campaign can be cancelled.', missingRequirements: [] };
  }

  // Handle resume from paused → live
  if (currentStatus === 'paused' && targetStatus === 'live') {
    return { allowed: true, reason: 'Campaign can be resumed to live.', missingRequirements: [] };
  }

  // Linear gate transitions
  switch (`${currentStatus}->${targetStatus}`) {
    case 'draft->in_review': {
      // Gate: brief must exist and be reviewed
      const briefs = await prisma.brief.findMany({
        where: { campaignId: campaign.campaignId },
      });
      if (briefs.length === 0) {
        missingRequirements.push('At least one brief must be created');
      }
      const hasReviewed = briefs.some(b => b.isReviewed);
      if (!hasReviewed) {
        missingRequirements.push('Brief must be marked as reviewed');
      }
      break;
    }

    case 'in_review->pitching': {
      // Gate: Director budget approval required
      const budgetApproval = await prisma.approval.findFirst({
        where: {
          campaignId: campaign.campaignId,
          type: 'budget',
          status: 'approved',
        },
      });
      if (!budgetApproval) {
        missingRequirements.push('Director budget approval required');
      }
      break;
    }

    case 'pitching->live': {
      // Gate: client shortlist approval required
      const shortlistApproval = await prisma.approval.findFirst({
        where: {
          campaignId: campaign.campaignId,
          type: 'shortlist',
          status: 'approved',
        },
      });
      if (!shortlistApproval) {
        missingRequirements.push('Client shortlist approval required');
      }
      break;
    }

    case 'live->reporting': {
      // Gate: all campaign influencers must have livePostUrl set
      const influencers = await prisma.campaignInfluencer.findMany({
        where: { campaignId: campaign.campaignId },
        include: { content: true },
      });
      if (influencers.length === 0) {
        missingRequirements.push('Campaign must have at least one influencer');
      }
      for (const ci of influencers) {
        const hasLivePost = ci.content.some(c => c.livePostUrl);
        if (!hasLivePost) {
          missingRequirements.push(`Influencer ${ci.influencerId} missing live post URL`);
        }
      }
      break;
    }

    case 'reporting->closed': {
      // Gate: report client-approved + all invoices status=paid
      const report = await prisma.report.findFirst({
        where: {
          campaignId: campaign.campaignId,
          status: 'approved',
        },
      });
      if (!report) {
        missingRequirements.push('Report must be client-approved');
      }
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          campaignId: campaign.campaignId,
          status: { not: 'paid' },
        },
      });
      if (unpaidInvoices.length > 0) {
        missingRequirements.push(`${unpaidInvoices.length} invoice(s) not yet paid`);
      }
      break;
    }

    default: {
      return {
        allowed: false,
        reason: `Invalid transition: '${currentStatus}' → '${targetStatus}'`,
        missingRequirements: [`No valid transition path from '${currentStatus}' to '${targetStatus}'`],
      };
    }
  }

  if (missingRequirements.length > 0) {
    return {
      allowed: false,
      reason: `Cannot transition to '${targetStatus}': requirements not met.`,
      missingRequirements,
    };
  }

  return { allowed: true, reason: `Transition to '${targetStatus}' is allowed.`, missingRequirements: [] };
}

// Legacy exports for backward compatibility
const CAMPAIGN_STATUS_TRANSITIONS = {
  draft: ['in_review', 'cancelled'],
  in_review: ['pitching', 'cancelled'],
  pitching: ['live', 'cancelled'],
  live: ['reporting', 'paused', 'cancelled'],
  reporting: ['closed', 'cancelled'],
  paused: ['live', 'cancelled'],
  closed: [],
  cancelled: [],
};

const COLLABORATION_STATUS_TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
};

function createStatusValidator(transitions) {
  return function canTransitionStatus(currentStatus, newStatus) {
    const allowedTransitions = transitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  };
}

module.exports = {
  validateTransition,
  createStatusValidator,
  CAMPAIGN_STATUS_TRANSITIONS,
  COLLABORATION_STATUS_TRANSITIONS,
};
