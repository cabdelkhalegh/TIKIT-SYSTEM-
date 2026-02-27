// Finance Overview Routes — Phase 8 US8
// T074: Global finance overview and filterable invoice list
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const asyncHandler = require('../middleware/async-handler');

const prisma = new PrismaClient();
const router = express.Router();

router.use(requireAuthentication);

// ─── T074: GET /finance/overview — Global financial overview ──────────────────
router.get('/finance/overview', asyncHandler(async (req, res) => {
  // All invoices
  const invoices = await prisma.invoice.findMany({
    select: { amount: true, status: true, type: true },
  });

  // Total revenue = sum of paid client invoices
  const totalRevenue = invoices
    .filter(i => i.type === 'client' && i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0);

  // Pending receivables = sent + approved client invoices
  const pendingReceivables = invoices
    .filter(i => i.type === 'client' && (i.status === 'sent' || i.status === 'approved'))
    .reduce((s, i) => s + i.amount, 0);

  // Pending payables = sent + approved influencer invoices
  const pendingPayables = invoices
    .filter(i => i.type === 'influencer' && (i.status === 'sent' || i.status === 'approved'))
    .reduce((s, i) => s + i.amount, 0);

  // Active campaigns count
  const activeCampaigns = await prisma.campaign.count({
    where: {
      status: { in: ['live', 'pitching', 'in_review'] },
      isDeleted: false,
    },
  });

  // Total management fees from active campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { isDeleted: false, totalBudget: { not: null } },
    select: { totalBudget: true, managementFee: true },
  });
  const totalManagementFees = campaigns.reduce(
    (s, c) => s + ((c.totalBudget || 0) * ((c.managementFee || 30) / 100)),
    0
  );

  // By status breakdown
  const byStatus = {};
  for (const status of ['draft', 'sent', 'approved', 'paid']) {
    const matching = invoices.filter(i => i.status === status);
    byStatus[status] = {
      count: matching.length,
      total: matching.reduce((s, i) => s + i.amount, 0),
    };
  }

  return res.json({
    success: true,
    data: {
      totalRevenue,
      pendingReceivables,
      pendingPayables,
      activeCampaigns,
      totalManagementFees,
      byStatus,
    },
  });
}));

// ─── T074: GET /finance/invoices — All invoices with filters ──────────────────
router.get('/finance/invoices', asyncHandler(async (req, res) => {
  const {
    page = '1',
    limit = '20',
    search,
    type,
    status,
    campaignId,
    dueDateFrom,
    dueDateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {};

  if (type) where.type = type;
  if (campaignId) where.campaignId = campaignId;

  if (status) {
    const statuses = status.split(',').map(s => s.trim());
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }

  if (dueDateFrom || dueDateTo) {
    where.dueDate = {};
    if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
    if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
  }

  if (search) {
    where.OR = [
      { displayId: { contains: search, mode: 'insensitive' } },
      { campaign: { campaignName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const allowedSortFields = ['createdAt', 'amount', 'dueDate', 'status'];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [orderField]: orderDir },
      include: {
        campaign: {
          select: {
            campaignId: true,
            displayId: true,
            campaignName: true,
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return res.json({
    success: true,
    data: {
      invoices: invoices.map(inv => ({
        ...inv,
        campaign: inv.campaign
          ? { id: inv.campaign.campaignId, displayId: inv.campaign.displayId, name: inv.campaign.campaignName }
          : null,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
}));

module.exports = router;
