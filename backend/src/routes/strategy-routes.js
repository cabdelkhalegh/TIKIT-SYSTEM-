// Strategy Routes — T036: AI strategy generation + CRUD
// POST generate, GET retrieve, PUT update

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const asyncHandler = require('../middleware/async-handler');
const { generateStrategy } = require('../services/gemini-service');

const prisma = new PrismaClient();
const router = express.Router();

// All routes require authentication
router.use(requireAuthentication);

// POST /campaigns/:campaignId/strategy — Generate strategy via Gemini
// Roles: director, campaign_manager
router.post(
  '/campaigns/:campaignId/strategy',
  asyncHandler(async (req, res) => {
    const { campaignId } = req.params;

    // Check campaign exists
    const campaign = await prisma.campaign.findUnique({ where: { campaignId } });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.status === 'closed') {
      return res.status(400).json({ success: false, error: 'Cannot generate strategy for a closed campaign' });
    }

    // Check brief is reviewed
    const brief = await prisma.brief.findFirst({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    if (!brief) {
      return res.status(400).json({ success: false, error: 'No brief found for this campaign' });
    }

    if (!brief.isReviewed) {
      return res.status(400).json({ success: false, error: 'Brief must be reviewed before generating strategy' });
    }

    // Build brief data for Gemini
    const briefData = {
      objectives: brief.objectives ? JSON.parse(brief.objectives) : [],
      kpis: brief.kpis ? JSON.parse(brief.kpis) : [],
      targetAudience: brief.targetAudience ? JSON.parse(brief.targetAudience) : {},
      deliverables: brief.deliverables ? JSON.parse(brief.deliverables) : [],
      budgetSignals: brief.budgetSignals ? JSON.parse(brief.budgetSignals) : {},
      clientInfo: brief.clientInfo ? JSON.parse(brief.clientInfo) : {},
      keyMessages: brief.keyMessages ? JSON.parse(brief.keyMessages) : [],
      contentPillars: brief.contentPillars ? JSON.parse(brief.contentPillars) : [],
      matchingCriteria: brief.matchingCriteria ? JSON.parse(brief.matchingCriteria) : {},
    };

    // Call Gemini
    const result = await generateStrategy(briefData);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: 'AI service unavailable. Please enter strategy manually.',
        fallbackRequired: true,
      });
    }

    const strategyData = result.data;

    // Upsert strategy (one per campaign)
    const strategy = await prisma.strategy.upsert({
      where: { campaignId },
      create: {
        campaignId,
        summary: strategyData.summary || null,
        keyMessages: strategyData.keyMessages ? JSON.stringify(strategyData.keyMessages) : null,
        contentPillars: strategyData.contentPillars ? JSON.stringify(strategyData.contentPillars) : null,
        matchingCriteria: strategyData.matchingCriteria ? JSON.stringify(strategyData.matchingCriteria) : null,
      },
      update: {
        summary: strategyData.summary || null,
        keyMessages: strategyData.keyMessages ? JSON.stringify(strategyData.keyMessages) : null,
        contentPillars: strategyData.contentPillars ? JSON.stringify(strategyData.contentPillars) : null,
        matchingCriteria: strategyData.matchingCriteria ? JSON.stringify(strategyData.matchingCriteria) : null,
      },
    });

    res.status(201).json({ success: true, data: strategy });
  })
);

// GET /campaigns/:campaignId/strategy — Retrieve strategy
// Roles: director, campaign_manager, reviewer
router.get(
  '/campaigns/:campaignId/strategy',
  asyncHandler(async (req, res) => {
    const { campaignId } = req.params;

    const strategy = await prisma.strategy.findUnique({ where: { campaignId } });

    if (!strategy) {
      return res.status(404).json({ success: false, error: 'No strategy found for this campaign' });
    }

    res.json({ success: true, data: strategy });
  })
);

// PUT /campaigns/:campaignId/strategy — Update editable fields
// Roles: director, campaign_manager
router.put(
  '/campaigns/:campaignId/strategy',
  asyncHandler(async (req, res) => {
    const { campaignId } = req.params;

    // Check campaign not closed
    const campaign = await prisma.campaign.findUnique({ where: { campaignId } });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    if (campaign.status === 'closed') {
      return res.status(400).json({ success: false, error: 'Cannot modify strategy of a closed campaign' });
    }

    const existing = await prisma.strategy.findUnique({ where: { campaignId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'No strategy found for this campaign' });
    }

    const updateData = {};
    if (req.body.summary !== undefined) updateData.summary = req.body.summary;
    if (req.body.keyMessages !== undefined) updateData.keyMessages = JSON.stringify(req.body.keyMessages);
    if (req.body.contentPillars !== undefined) updateData.contentPillars = JSON.stringify(req.body.contentPillars);
    if (req.body.matchingCriteria !== undefined) updateData.matchingCriteria = JSON.stringify(req.body.matchingCriteria);

    const strategy = await prisma.strategy.update({
      where: { campaignId },
      data: updateData,
    });

    res.json({ success: true, data: strategy });
  })
);

module.exports = router;
