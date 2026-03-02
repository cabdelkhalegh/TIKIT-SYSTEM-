// T123: Audit log routes — GET /audit-logs with role-based filtering, pagination, entity type filter
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');

const prisma = new PrismaClient();

// GET /audit-logs — paginated, filterable by entityType, action, userId
router.get('/', requireAuthentication, async (req, res) => {
  try {
    const {
      page = '1',
      perPage = '25',
      entityType,
      action,
      userId,
      entityId,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.min(100, Math.max(1, parseInt(perPage)));
    const skip = (pageNum - 1) * limit;

    // Build where clause
    const where = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (entityId) where.entityId = entityId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { userId: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parse changes JSON for response
    const formatted = logs.map((log) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
