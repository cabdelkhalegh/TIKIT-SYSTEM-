// T125: Escalation service — check pending approvals and escalate at 24h/48h/72h
// Per R-008: 24h → reminder, 48h → overdue, 72h → Director escalation
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ESCALATION_THRESHOLDS = [
  { hours: 24, level: 1, label: 'reminder', priority: 'normal' },
  { hours: 48, level: 2, label: 'overdue', priority: 'high' },
  { hours: 72, level: 3, label: 'director_escalation', priority: 'urgent' },
];

/**
 * Check all pending approvals and create escalation notifications as needed.
 * Designed to be called on a schedule (e.g., cron job or manual trigger).
 */
async function checkEscalations() {
  const now = new Date();
  const results = { checked: 0, escalated: 0, errors: [] };

  try {
    // Get all pending approvals
    const pendingApprovals = await prisma.approval.findMany({
      where: { status: 'pending' },
      include: {
        campaign: {
          select: { campaignId: true, campaignName: true, displayId: true },
        },
      },
    });

    results.checked = pendingApprovals.length;

    for (const approval of pendingApprovals) {
      try {
        const ageMs = now.getTime() - new Date(approval.createdAt).getTime();
        const ageHours = ageMs / (1000 * 60 * 60);

        for (const threshold of ESCALATION_THRESHOLDS) {
          if (ageHours < threshold.hours) continue;

          // Check if this escalation level was already sent for this approval
          const existing = await prisma.notification.findFirst({
            where: {
              entityType: 'Approval',
              entityId: approval.id,
              isEscalation: true,
              escalationLevel: threshold.level,
            },
          });

          if (existing) continue; // Already escalated at this level

          // Determine recipient
          const recipientUserId = await getEscalationRecipient(approval, threshold.level);
          if (!recipientUserId) continue;

          const campaignLabel = approval.campaign?.displayId || approval.campaign?.campaignName || approval.campaignId;

          await prisma.notification.create({
            data: {
              userId: recipientUserId,
              campaignId: approval.campaignId,
              notificationType: 'system',
              category: 'escalation',
              title: getEscalationTitle(threshold),
              message: `Approval for ${approval.type} on campaign ${campaignLabel} has been pending for ${Math.floor(ageHours)}h.`,
              priority: threshold.priority,
              isEscalation: true,
              escalationLevel: threshold.level,
              entityType: 'Approval',
              entityId: approval.id,
              actionUrl: `/dashboard/campaigns/${approval.campaignId}`,
            },
          });

          results.escalated++;
        }
      } catch (err) {
        results.errors.push({ approvalId: approval.id, error: err.message });
      }
    }
  } catch (err) {
    results.errors.push({ error: err.message });
  }

  return results;
}

/**
 * Get the correct recipient for a given escalation level.
 * Level 1-2: campaign managers on the campaign; Level 3: directors
 */
async function getEscalationRecipient(approval, level) {
  if (level >= 3) {
    // Find a director
    const director = await prisma.userRole.findFirst({
      where: { role: 'director' },
      select: { userId: true },
    });
    return director?.userId || null;
  }

  // For levels 1-2, find the campaign creator or any campaign_manager
  const campaign = await prisma.campaign.findUnique({
    where: { campaignId: approval.campaignId },
    select: { createdById: true },
  });

  if (campaign?.createdById) return campaign.createdById;

  // Fallback: any campaign manager
  const cm = await prisma.userRole.findFirst({
    where: { role: 'campaign_manager' },
    select: { userId: true },
  });
  return cm?.userId || null;
}

function getEscalationTitle(threshold) {
  switch (threshold.level) {
    case 1: return 'Approval Reminder';
    case 2: return 'Overdue Approval';
    case 3: return 'Director Escalation: Overdue Approval';
    default: return 'Escalation';
  }
}

/**
 * Check data retention expiry for closed campaigns.
 * Notifies Director 30 days before retentionExpiresAt.
 */
async function checkDataRetention() {
  const results = { checked: 0, notified: 0 };

  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find closed campaigns with retentionExpiresAt within 30 days
    const expiring = await prisma.campaign.findMany({
      where: {
        status: 'closed',
        retentionExpiresAt: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      select: { campaignId: true, campaignName: true, displayId: true, retentionExpiresAt: true },
    });

    results.checked = expiring.length;

    for (const campaign of expiring) {
      // Check if notification already sent
      const existing = await prisma.notification.findFirst({
        where: {
          entityType: 'Campaign',
          entityId: campaign.campaignId,
          category: 'data_retention',
        },
      });

      if (existing) continue;

      // Find director to notify
      const director = await prisma.userRole.findFirst({
        where: { role: 'director' },
        select: { userId: true },
      });

      if (!director) continue;

      await prisma.notification.create({
        data: {
          userId: director.userId,
          campaignId: campaign.campaignId,
          notificationType: 'system',
          category: 'data_retention',
          title: 'Data Retention Expiring Soon',
          message: `Campaign ${campaign.displayId || campaign.campaignName} data retention expires on ${campaign.retentionExpiresAt.toISOString().split('T')[0]}.`,
          priority: 'high',
          entityType: 'Campaign',
          entityId: campaign.campaignId,
          actionUrl: `/dashboard/campaigns/${campaign.campaignId}`,
        },
      });

      results.notified++;
    }
  } catch (err) {
    results.errors = [err.message];
  }

  return results;
}

module.exports = {
  checkEscalations,
  checkDataRetention,
};
