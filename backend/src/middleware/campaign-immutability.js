/**
 * Campaign Immutability Middleware (Prisma $use middleware)
 * Intercepts update/delete on Campaign where status=closed and closedAt is set
 * Per R-010 and Constitution Section IV: "No exceptions. Database enforces this."
 *
 * Usage: call setupCampaignImmutability(prisma) in index.js after creating the PrismaClient
 */

function setupCampaignImmutability(prisma) {
  prisma.$use(async (params, next) => {
    // Only intercept Campaign model operations
    if (params.model !== 'Campaign') {
      return next(params);
    }

    // Only intercept update and delete operations
    if (params.action !== 'update' && params.action !== 'updateMany' &&
        params.action !== 'delete' && params.action !== 'deleteMany') {
      return next(params);
    }

    // For single update/delete, check the target campaign
    if (params.action === 'update' || params.action === 'delete') {
      const where = params.args.where;
      if (where) {
        const campaign = await prisma.campaign.findUnique({
          where,
          select: { status: true, closedAt: true },
        });

        if (campaign && campaign.status === 'closed' && campaign.closedAt) {
          throw new Error('Campaign is closed and immutable. No updates or deletions are permitted.');
        }
      }
    }

    // For updateMany/deleteMany, check if any matching campaigns are closed
    if (params.action === 'updateMany' || params.action === 'deleteMany') {
      const where = params.args.where || {};
      const closedCount = await prisma.campaign.count({
        where: {
          ...where,
          status: 'closed',
          closedAt: { not: null },
        },
      });

      if (closedCount > 0) {
        throw new Error(`Cannot modify/delete ${closedCount} closed campaign(s). Closed campaigns are immutable.`);
      }
    }

    return next(params);
  });
}

module.exports = { setupCampaignImmutability };
