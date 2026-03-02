// T122: Prisma middleware for audit logging — intercepts create/update/delete on tracked models
// Writes to AuditLog table per R-012
const { PrismaClient } = require('@prisma/client');

const TRACKED_MODELS = [
  'Campaign', 'Content', 'Invoice', 'CampaignInfluencer', 'Approval', 'User',
];

const ACTION_MAP = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
};

/**
 * Attach audit logging middleware to a Prisma client instance.
 * Must be called once at application startup.
 */
function attachAuditMiddleware(prismaInstance) {
  prismaInstance.$use(async (params, next) => {
    // Only track specific models and mutating actions
    if (!TRACKED_MODELS.includes(params.model) || !ACTION_MAP[params.action]) {
      return next(params);
    }

    // Capture "before" snapshot for update / delete
    let beforeSnapshot = null;
    if ((params.action === 'update' || params.action === 'delete') && params.args.where) {
      try {
        beforeSnapshot = await prismaInstance[lcFirst(params.model)].findUnique({
          where: params.args.where,
        });
      } catch {
        // Non-critical — proceed without snapshot
      }
    }

    // Execute the actual operation
    const result = await next(params);

    // Build audit entry (fire-and-forget — never block the main operation)
    try {
      const entityId = extractEntityId(params, result);
      const changes = buildChangesJson(params.action, beforeSnapshot, result, params.args.data);

      // userId comes from _audit context attached by route handlers
      const userId = params.args?._auditUserId || params.args?.data?._auditUserId || null;

      // Clean up the internal field so it doesn't pollute Prisma
      if (params.args?.data?._auditUserId) {
        delete params.args.data._auditUserId;
      }

      if (userId) {
        await prismaInstance.auditLog.create({
          data: {
            userId,
            action: ACTION_MAP[params.action],
            entityType: params.model,
            entityId: entityId || null,
            changes: changes ? JSON.stringify(changes) : null,
          },
        }).catch(() => {});
      }
    } catch {
      // Audit logging should never break the main operation
    }

    return result;
  });
}

/**
 * Helper: create an audit log entry directly (for use in route handlers)
 */
async function createAuditEntry(prismaInstance, { userId, action, entityType, entityId, changes, ipAddress }) {
  try {
    await prismaInstance.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch {
    // Non-critical
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lcFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function extractEntityId(params, result) {
  if (result && typeof result === 'object') {
    // Check common id fields
    return result.id || result.campaignId || result.userId || result.invoiceId || null;
  }
  return null;
}

function buildChangesJson(action, before, after, data) {
  if (action === 'create') {
    return { created: data || {} };
  }
  if (action === 'delete') {
    return { deleted: before || {} };
  }
  if (action === 'update' && before && data) {
    const diff = {};
    for (const key of Object.keys(data)) {
      if (key.startsWith('_')) continue; // skip internal fields
      if (JSON.stringify(before[key]) !== JSON.stringify(data[key])) {
        diff[key] = { from: before[key], to: data[key] };
      }
    }
    return Object.keys(diff).length > 0 ? diff : null;
  }
  return null;
}

module.exports = {
  attachAuditMiddleware,
  createAuditEntry,
};
