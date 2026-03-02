// T110: Closure Routes — checklist, CX survey, post-mortem, AI learnings, close campaign
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const geminiService = require('../services/gemini-service');

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveCampaignId(campaignIdOrDisplayId) {
  const byDisplayId = await prisma.campaign.findFirst({
    where: { displayId: campaignIdOrDisplayId },
    select: { campaignId: true },
  });
  if (byDisplayId) return byDisplayId.campaignId;
  return campaignIdOrDisplayId;
}

// ─── GET /campaigns/:id/closure — closure checklist ─────────────────────────

router.get('/campaigns/:id/closure', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.id);

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: resolvedCampaignId },
      include: {
        cxSurvey: true,
        postMortem: true,
      },
    });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Check report approved
    const approvedReport = await prisma.report.findFirst({
      where: {
        campaignId: resolvedCampaignId,
        status: { in: ['approved', 'exported'] },
      },
    });

    // Check all invoices paid
    const invoices = await prisma.invoice.findMany({
      where: { campaignId: resolvedCampaignId },
    });
    const allInvoicesSettled =
      invoices.length === 0 || invoices.every((inv) => inv.status === 'paid');

    const cxSurveyCompleted = !!campaign.cxSurvey;
    const postMortemCompleted = !!campaign.postMortem;

    // Check AI learnings — stored in postMortem's budgetAnalysis field as JSON
    const aiLearningsGenerated = !!(
      campaign.postMortem?.budgetAnalysis &&
      campaign.postMortem.budgetAnalysis.startsWith('{')
    );

    const checklist = {
      reportApproved: !!approvedReport,
      allInvoicesSettled,
      cxSurveyCompleted,
      postMortemCompleted,
      aiLearningsGenerated,
    };

    const canClose = Object.values(checklist).every(Boolean);

    const unmetRequirements = [];
    if (!checklist.reportApproved) unmetRequirements.push('Report must be client-approved');
    if (!checklist.allInvoicesSettled) unmetRequirements.push('All invoices must be paid');
    if (!checklist.cxSurveyCompleted) unmetRequirements.push('CX survey must be completed');
    if (!checklist.postMortemCompleted) unmetRequirements.push('Post-mortem must be completed');
    if (!checklist.aiLearningsGenerated) unmetRequirements.push('AI learnings must be generated');

    res.json({
      success: true,
      data: {
        campaignId: resolvedCampaignId,
        status: campaign.status,
        checklist,
        canClose,
        unmetRequirements,
      },
    });
  } catch (error) {
    console.error('Error fetching closure status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch closure status' });
  }
});

// ─── POST /campaigns/:id/closure/cx-survey — upsert CX survey ──────────────

router.post('/campaigns/:id/closure/cx-survey', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.id);
    const {
      overallScore,
      communicationScore,
      qualityScore,
      timelinessScore,
      valueScore,
      testimonial,
    } = req.body;

    // Validate scores 1-5
    const scores = { overallScore, communicationScore, qualityScore, timelinessScore, valueScore };
    for (const [key, val] of Object.entries(scores)) {
      if (!val || !Number.isInteger(val) || val < 1 || val > 5) {
        return res.status(400).json({
          success: false,
          error: `${key} must be an integer between 1 and 5`,
        });
      }
    }

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: resolvedCampaignId },
    });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const survey = await prisma.cXSurvey.upsert({
      where: { campaignId: resolvedCampaignId },
      create: {
        campaignId: resolvedCampaignId,
        overallScore,
        communicationScore,
        qualityScore,
        timelinessScore,
        valueScore,
        testimonial: testimonial || null,
      },
      update: {
        overallScore,
        communicationScore,
        qualityScore,
        timelinessScore,
        valueScore,
        testimonial: testimonial || null,
      },
    });

    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    console.error('Error saving CX survey:', error);
    res.status(500).json({ success: false, error: 'Failed to save CX survey' });
  }
});

// ─── POST /campaigns/:id/closure/post-mortem — upsert post-mortem ───────────

router.post('/campaigns/:id/closure/post-mortem', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.id);
    const { wentWell, improvements, lessons, actionItems, riskNotes } = req.body;

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: resolvedCampaignId },
    });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const postMortem = await prisma.postMortem.upsert({
      where: { campaignId: resolvedCampaignId },
      create: {
        campaignId: resolvedCampaignId,
        wentWell: JSON.stringify(wentWell || []),
        improvements: JSON.stringify(improvements || []),
        lessons: JSON.stringify(lessons || []),
        actionItems: JSON.stringify(actionItems || []),
        riskNotes: riskNotes || null,
      },
      update: {
        wentWell: JSON.stringify(wentWell || []),
        improvements: JSON.stringify(improvements || []),
        lessons: JSON.stringify(lessons || []),
        actionItems: JSON.stringify(actionItems || []),
        riskNotes: riskNotes || null,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...postMortem,
        wentWell: JSON.parse(postMortem.wentWell || '[]'),
        improvements: JSON.parse(postMortem.improvements || '[]'),
        lessons: JSON.parse(postMortem.lessons || '[]'),
        actionItems: JSON.parse(postMortem.actionItems || '[]'),
      },
    });
  } catch (error) {
    console.error('Error saving post-mortem:', error);
    res.status(500).json({ success: false, error: 'Failed to save post-mortem' });
  }
});

// ─── POST /campaigns/:id/closure/ai-learnings — generate AI learnings ───────

router.post('/campaigns/:id/closure/ai-learnings', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.id);

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: resolvedCampaignId },
      include: {
        cxSurvey: true,
        postMortem: true,
        client: { select: { companyName: true } },
      },
    });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (!campaign.cxSurvey || !campaign.postMortem) {
      return res.status(400).json({
        success: false,
        error: 'CX survey and post-mortem must be completed before generating AI learnings',
      });
    }

    // Get KPI summary
    const kpis = await prisma.kPI.findMany({
      where: { campaignId: resolvedCampaignId },
    });
    let totalReach = 0;
    let totalEngagement = 0;
    for (const k of kpis) {
      totalReach += k.reach || 0;
      totalEngagement += k.engagement || 0;
    }
    const kpiSummary = { totalReach, totalEngagement, kpiCount: kpis.length };

    const campaignData = {
      name: campaign.campaignName,
      displayId: campaign.displayId,
      client: campaign.client?.companyName,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    };

    const cxSurvey = campaign.cxSurvey;
    const postMortem = {
      wentWell: JSON.parse(campaign.postMortem.wentWell || '[]'),
      improvements: JSON.parse(campaign.postMortem.improvements || '[]'),
      lessons: JSON.parse(campaign.postMortem.lessons || '[]'),
      actionItems: JSON.parse(campaign.postMortem.actionItems || '[]'),
      riskNotes: campaign.postMortem.riskNotes,
    };

    const aiResult = await geminiService.generateClosureIntelligence(
      campaignData,
      cxSurvey,
      postMortem,
      kpiSummary
    );

    if (!aiResult.success) {
      return res.status(503).json({
        success: false,
        fallbackRequired: true,
        error: aiResult.error || 'AI service unavailable',
      });
    }

    // Store AI learnings in postMortem.budgetAnalysis as JSON (reusing available field)
    await prisma.postMortem.update({
      where: { campaignId: resolvedCampaignId },
      data: {
        budgetAnalysis: JSON.stringify(aiResult.data),
      },
    });

    res.json({
      success: true,
      data: {
        learnings: aiResult.data.learnings || [],
        bestPractices: aiResult.data.bestPractices || [],
        intelligenceDocument: aiResult.data.intelligenceDocument || aiResult.data.wrapUp || '',
      },
    });
  } catch (error) {
    console.error('Error generating AI learnings:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI learnings' });
  }
});

// ─── POST /campaigns/:id/closure/close — close campaign ────────────────────

router.post('/campaigns/:id/closure/close', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.id);

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: resolvedCampaignId },
      include: {
        cxSurvey: true,
        postMortem: true,
      },
    });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Validate all closure requirements
    const unmetRequirements = [];

    // 1. Report approved
    const approvedReport = await prisma.report.findFirst({
      where: {
        campaignId: resolvedCampaignId,
        status: { in: ['approved', 'exported'] },
      },
    });
    if (!approvedReport) unmetRequirements.push('Report must be client-approved');

    // 2. All invoices paid
    const invoices = await prisma.invoice.findMany({
      where: { campaignId: resolvedCampaignId },
    });
    const allPaid = invoices.length === 0 || invoices.every((inv) => inv.status === 'paid');
    if (!allPaid) unmetRequirements.push('All invoices must be paid');

    // 3. CX survey completed
    if (!campaign.cxSurvey) unmetRequirements.push('CX survey must be completed');

    // 4. Post-mortem completed
    if (!campaign.postMortem) unmetRequirements.push('Post-mortem must be completed');

    if (unmetRequirements.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot close campaign — requirements not met',
        data: { unmetRequirements },
      });
    }

    // Close the campaign
    const now = new Date();
    const retentionExpiresAt = new Date(now);
    retentionExpiresAt.setFullYear(retentionExpiresAt.getFullYear() + 3);

    const updated = await prisma.campaign.update({
      where: { campaignId: resolvedCampaignId },
      data: {
        status: 'closed',
        phase: 'closure',
        closedAt: now,
        retentionExpiresAt,
      },
    });

    // Log audit entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'campaign_closed',
          entityType: 'Campaign',
          entityId: resolvedCampaignId,
          changes: JSON.stringify({ status: { from: campaign.status, to: 'closed' } }),
        },
      });
    } catch (auditErr) {
      console.error('Audit log error (non-blocking):', auditErr.message);
    }

    res.json({
      success: true,
      data: {
        campaignId: resolvedCampaignId,
        status: 'closed',
        closedAt: updated.closedAt,
        retentionExpiresAt: updated.retentionExpiresAt,
      },
    });
  } catch (error) {
    console.error('Error closing campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to close campaign' });
  }
});

module.exports = router;
