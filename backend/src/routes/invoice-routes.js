// Invoice Management Routes — Phase 8 US8 Finance & Invoicing
// T071: Enhanced invoice CRUD with display ID, 4-stage status flow, budget recalc
// T073: Budget revision history endpoint
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const asyncHandler = require('../middleware/async-handler');
const { generateInvoiceId } = require('../services/id-generator-service');

const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication to all routes
router.use(requireAuthentication);

// ─── Valid invoice status transitions (forward-only) ──────────────────────────
const VALID_TRANSITIONS = {
  draft: ['sent'],
  sent: ['approved'],
  approved: ['paid'],
  paid: [], // terminal state
};

// ─── Helper: recalculate campaign financial totals from invoices ──────────────
async function recalcCampaignFinancials(campaignId) {
  const invoices = await prisma.invoice.findMany({
    where: { campaignId },
    select: { amount: true, status: true, type: true },
  });

  let totalInvoiced = 0;
  let totalPaid = 0;

  for (const inv of invoices) {
    totalInvoiced += inv.amount;
    if (inv.status === 'paid') {
      totalPaid += inv.amount;
    }
  }

  // committed = sum of approved + paid invoices (influencer type)
  const committed = invoices
    .filter(i => i.type === 'influencer' && (i.status === 'approved' || i.status === 'paid'))
    .reduce((sum, i) => sum + i.amount, 0);

  // spent = sum of paid invoices (influencer type)
  const spent = invoices
    .filter(i => i.type === 'influencer' && i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  await prisma.campaign.update({
    where: { campaignId },
    data: {
      allocatedBudget: committed,
      spentBudget: spent,
    },
  });
}

// ─── T071: POST /campaigns/:campaignId/invoices — Create invoice ──────────────
router.post('/campaigns/:campaignId/invoices', asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const { type, amount, currency, dueDate, notes, fileUrl } = req.body;

  // Validate campaign exists
  const campaign = await prisma.campaign.findUnique({
    where: { campaignId },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  if (campaign.status === 'closed') {
    return res.status(400).json({ success: false, error: 'Cannot create invoices for a closed campaign' });
  }

  // Validate type
  if (!type || !['client', 'influencer'].includes(type)) {
    return res.status(400).json({ success: false, error: 'type must be one of: client, influencer' });
  }

  // Validate amount
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, error: 'amount is required and must be a positive number' });
  }

  // Generate INV-YYYY-XXXX display ID
  const displayId = await generateInvoiceId();

  const invoice = await prisma.invoice.create({
    data: {
      displayId,
      type,
      status: 'draft',
      amount,
      currency: currency || 'AED',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
      fileUrl: fileUrl || null,
      campaignId,
    },
    include: {
      campaign: {
        select: { campaignId: true, campaignName: true, displayId: true },
      },
    },
  });

  // Recalculate campaign financials
  await recalcCampaignFinancials(campaignId);

  return res.status(201).json({ success: true, data: invoice });
}));

// ─── T071: GET /campaigns/:campaignId/invoices — List campaign invoices ───────
router.get('/campaigns/:campaignId/invoices', asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const { type, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const campaign = await prisma.campaign.findUnique({
    where: { campaignId },
    select: { campaignId: true },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const where = { campaignId };
  if (type) where.type = type;
  if (status) where.status = status;

  const allowedSortFields = ['createdAt', 'amount', 'dueDate', 'status'];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { [orderField]: orderDir },
    include: {
      campaign: {
        select: { campaignId: true, campaignName: true, displayId: true },
      },
    },
  });

  return res.json({
    success: true,
    data: { campaignId, invoices, count: invoices.length },
  });
}));

// ─── T071: PATCH /campaigns/:campaignId/invoices/:id/status — Status transition
router.patch('/campaigns/:campaignId/invoices/:id/status', asyncHandler(async (req, res) => {
  const { campaignId, id } = req.params;
  const { status: targetStatus } = req.body;

  if (!targetStatus) {
    return res.status(400).json({ success: false, error: 'status is required' });
  }

  // Find invoice (by id or displayId)
  const invoice = await prisma.invoice.findFirst({
    where: {
      campaignId,
      OR: [{ id }, { displayId: id }],
    },
  });

  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[invoice.status] || [];
  if (!allowed.includes(targetStatus)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status transition from ${invoice.status} to ${targetStatus}`,
    });
  }

  // Build update data
  const updateData = { status: targetStatus };

  if (targetStatus === 'sent') {
    updateData.sentAt = new Date();
  }
  if (targetStatus === 'paid') {
    updateData.paidAt = new Date();
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: updateData,
  });

  // Recalculate campaign financial totals
  await recalcCampaignFinancials(campaignId);

  return res.json({
    success: true,
    data: {
      id: updatedInvoice.id,
      displayId: updatedInvoice.displayId,
      previousStatus: invoice.status,
      newStatus: targetStatus,
      updatedAt: updatedInvoice.updatedAt,
    },
  });
}));

// ─── T071: GET /campaigns/:campaignId/budget — Budget tracker ─────────────────
router.get('/campaigns/:campaignId/budget', asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  const campaign = await prisma.campaign.findUnique({
    where: { campaignId },
    select: {
      campaignId: true,
      displayId: true,
      campaignName: true,
      totalBudget: true,
      managementFee: true,
      allocatedBudget: true,
      spentBudget: true,
    },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const budget = campaign.totalBudget || 0;
  const feePercent = campaign.managementFee || 30;
  const managementFeeAmount = budget * (feePercent / 100);
  const netBudget = budget - managementFeeAmount;

  // Get invoice breakdown
  const invoices = await prisma.invoice.findMany({
    where: { campaignId },
    select: { amount: true, status: true, type: true },
  });

  const influencerInvoices = invoices.filter(i => i.type === 'influencer');
  const clientInvoices = invoices.filter(i => i.type === 'client');

  const committed = influencerInvoices
    .filter(i => i.status === 'approved' || i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const spent = influencerInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const remaining = netBudget - committed;
  const utilizationPercent = netBudget > 0
    ? Math.round((committed / netBudget) * 100)
    : 0;

  // Get last budget revision
  const lastRevision = await prisma.budgetRevision.findFirst({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  });

  const sumByStatus = (arr, status) =>
    arr.filter(i => i.status === status).reduce((s, i) => s + i.amount, 0);

  return res.json({
    success: true,
    data: {
      campaignId: campaign.campaignId,
      displayId: campaign.displayId,
      budget,
      managementFee: feePercent,
      managementFeeAmount,
      netBudget,
      committed,
      spent,
      remaining,
      utilizationPercent,
      breakdown: {
        influencerCosts: { committed, paid: spent },
        clientInvoices: {
          total: clientInvoices.reduce((s, i) => s + i.amount, 0),
          sent: sumByStatus(clientInvoices, 'sent'),
          approved: sumByStatus(clientInvoices, 'approved'),
          paid: sumByStatus(clientInvoices, 'paid'),
        },
        influencerInvoices: {
          total: influencerInvoices.reduce((s, i) => s + i.amount, 0),
          sent: sumByStatus(influencerInvoices, 'sent'),
          approved: sumByStatus(influencerInvoices, 'approved'),
          paid: sumByStatus(influencerInvoices, 'paid'),
        },
      },
      lastRevision: lastRevision || null,
    },
  });
}));

// ─── T073: GET /campaigns/:campaignId/budget/revisions — Revision history ─────
router.get('/campaigns/:campaignId/budget/revisions', asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  const campaign = await prisma.campaign.findUnique({
    where: { campaignId },
    select: { campaignId: true },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const revisions = await prisma.budgetRevision.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich with changedByName
  const userIds = [...new Set(revisions.map(r => r.changedBy))];
  const users = await prisma.user.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, displayName: true, fullName: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.userId, u.displayName || u.fullName || 'Unknown']));

  const enriched = revisions.map(r => ({
    ...r,
    changedByName: userMap[r.changedBy] || 'Unknown',
  }));

  return res.json({
    success: true,
    data: { campaignId, revisions: enriched, count: enriched.length },
  });
}));

module.exports = router;
