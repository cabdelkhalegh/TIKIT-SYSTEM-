// T104: Report Routes — create, get, status transition, export PDF/CSV, share link, list all
const express = require('express');
const crypto = require('crypto');
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

async function aggregateKPIs(campaignId) {
  const kpis = await prisma.kPI.findMany({
    where: { campaignId },
    include: {
      campaignInfluencer: {
        include: {
          influencer: { select: { influencerId: true, displayId: true, handle: true } },
        },
      },
    },
  });

  // Use latest capture day per influencer for totals
  const byInfluencerMap = new Map();
  for (const k of kpis) {
    const ciId = k.campaignInfluencerId;
    if (!ciId) continue;
    const existing = byInfluencerMap.get(ciId);
    if (!existing || (k.captureDay || 0) > (existing.captureDay || 0)) {
      byInfluencerMap.set(ciId, k);
    }
  }

  let totalReach = 0;
  let totalImpressions = 0;
  let totalEngagement = 0;
  let totalClicks = 0;
  const byInfluencer = [];

  for (const [ciId, k] of byInfluencerMap) {
    totalReach += k.reach || 0;
    totalImpressions += k.impressions || 0;
    totalEngagement += k.engagement || 0;
    totalClicks += k.clicks || 0;
    byInfluencer.push({
      handle: k.campaignInfluencer?.influencer?.handle || null,
      reach: k.reach || 0,
      impressions: k.impressions || 0,
      engagement: k.engagement || 0,
      clicks: k.clicks || 0,
    });
  }

  const averageEngagementRate =
    totalReach > 0 ? Math.round((totalEngagement / totalReach) * 100 * 100) / 100 : 0;

  return {
    totalReach,
    totalImpressions,
    totalEngagement,
    totalClicks,
    averageEngagementRate,
    influencerCount: byInfluencerMap.size,
    byInfluencer,
  };
}

// Valid status transitions
const VALID_TRANSITIONS = {
  draft: ['pending_approval'],
  pending_approval: ['approved'],
  approved: ['exported'],
};

// ─── POST /campaigns/:campaignId/reports — create report ────────────────────

router.post('/campaigns/:campaignId/reports', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { highlights, generateNarrative = true } = req.body;

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: resolvedCampaignId },
      include: {
        client: { select: { companyName: true } },
      },
    });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    if (campaign.status === 'closed') {
      return res.status(400).json({ success: false, error: 'Cannot create reports for a closed campaign' });
    }

    // Aggregate KPIs
    const kpiSummary = await aggregateKPIs(resolvedCampaignId);
    if (kpiSummary.influencerCount === 0) {
      return res.status(400).json({ success: false, error: 'Campaign has no KPI data to generate a report from' });
    }

    // Generate AI narrative
    let aiNarrative = null;
    let aiHighlights = highlights ? [highlights] : [];
    let recommendations = [];

    if (generateNarrative) {
      const campaignContext = {
        name: campaign.campaignName,
        displayId: campaign.displayId,
        client: campaign.client?.companyName,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget,
        status: campaign.status,
      };

      const aiResult = await geminiService.generateReportNarrative(kpiSummary, campaignContext);
      if (aiResult.success && aiResult.data) {
        aiNarrative = aiResult.data.narrative || null;
        if (aiResult.data.highlights) aiHighlights = aiResult.data.highlights;
        if (aiResult.data.recommendations) recommendations = aiResult.data.recommendations;
      }
    }

    // Store recommendations inside highlights JSON as combined object
    const highlightsData = { highlights: aiHighlights, recommendations };

    const report = await prisma.report.create({
      data: {
        campaignId: resolvedCampaignId,
        status: 'draft',
        kpiSummary: JSON.stringify(kpiSummary),
        highlights: JSON.stringify(highlightsData),
        aiNarrative,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...report,
        kpiSummary,
        highlights: aiHighlights,
        recommendations,
      },
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, error: 'Failed to create report' });
  }
});

// ─── GET /campaigns/:campaignId/reports — list reports for campaign ──────────

router.get('/campaigns/:campaignId/reports', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);

    const reports = await prisma.report.findMany({
      where: { campaignId: resolvedCampaignId },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: {
            displayId: true,
            campaignName: true,
            client: { select: { companyName: true } },
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const formatted = reports.map((r) => {
      const hl = r.highlights ? JSON.parse(r.highlights) : {};
      return {
        ...r,
        kpiSummary: r.kpiSummary ? JSON.parse(r.kpiSummary) : null,
        highlights: hl.highlights || (Array.isArray(hl) ? hl : []),
        recommendations: hl.recommendations || [],
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

// ─── GET /campaigns/:campaignId/reports/:reportId — get report ──────────────

router.get('/campaigns/:campaignId/reports/:reportId', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { reportId } = req.params;

    const report = await prisma.report.findFirst({
      where: { id: reportId, campaignId: resolvedCampaignId },
      include: {
        campaign: {
          select: {
            displayId: true,
            campaignName: true,
            client: { select: { companyName: true } },
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const hl = report.highlights ? JSON.parse(report.highlights) : {};
    res.json({
      success: true,
      data: {
        ...report,
        kpiSummary: report.kpiSummary ? JSON.parse(report.kpiSummary) : null,
        highlights: hl.highlights || (Array.isArray(hl) ? hl : []),
        recommendations: hl.recommendations || [],
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

// ─── PATCH /campaigns/:campaignId/reports/:reportId/status — transition ─────

router.patch('/campaigns/:campaignId/reports/:reportId/status', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { reportId } = req.params;
    const { status } = req.body;

    const report = await prisma.report.findFirst({
      where: { id: reportId, campaignId: resolvedCampaignId },
    });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const validTargets = VALID_TRANSITIONS[report.status];
    if (!validTargets || !validTargets.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from ${report.status} to ${status}`,
      });
    }

    const updateData = { status };
    if (status === 'approved') {
      updateData.approvedBy = req.user.userId;
      updateData.approvedAt = new Date();
    }
    if (status === 'exported') {
      updateData.exportedAt = new Date();
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        previousStatus: report.status,
        newStatus: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error transitioning report status:', error);
    res.status(500).json({ success: false, error: 'Failed to update report status' });
  }
});

// ─── GET /campaigns/:campaignId/reports/:reportId/export/pdf — PDF data ─────

router.get('/campaigns/:campaignId/reports/:reportId/export/pdf', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { reportId } = req.params;

    const report = await prisma.report.findFirst({
      where: { id: reportId, campaignId: resolvedCampaignId },
      include: {
        campaign: {
          select: {
            displayId: true,
            campaignName: true,
            client: { select: { companyName: true } },
            startDate: true,
            endDate: true,
            budget: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Return JSON data formatted for PDF rendering (frontend handles actual PDF)
    const pdfData = {
      title: `Campaign Report: ${report.campaign.campaignName}`,
      displayId: report.campaign.displayId,
      client: report.campaign.client?.companyName || 'N/A',
      period: {
        start: report.campaign.startDate,
        end: report.campaign.endDate,
      },
      status: report.status,
      kpiSummary: report.kpiSummary ? JSON.parse(report.kpiSummary) : null,
      highlights: (() => { const h = report.highlights ? JSON.parse(report.highlights) : {}; return h.highlights || (Array.isArray(h) ? h : []); })(),
      narrative: report.aiNarrative,
      recommendations: (() => { const h = report.highlights ? JSON.parse(report.highlights) : {}; return h.recommendations || []; })()
      approvedBy: report.approvedBy,
      approvedAt: report.approvedAt,
      generatedAt: new Date().toISOString(),
    };

    // Update exportedAt
    await prisma.report.update({
      where: { id: reportId },
      data: { exportedAt: new Date() },
    });

    res.json({ success: true, data: pdfData });
  } catch (error) {
    console.error('Error exporting report as PDF:', error);
    res.status(500).json({ success: false, error: 'Failed to export report' });
  }
});

// ─── GET /campaigns/:campaignId/reports/:reportId/export/csv — CSV data ─────

router.get('/campaigns/:campaignId/reports/:reportId/export/csv', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { reportId } = req.params;

    const report = await prisma.report.findFirst({
      where: { id: reportId, campaignId: resolvedCampaignId },
    });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Fetch raw KPIs for CSV
    const kpis = await prisma.kPI.findMany({
      where: { campaignId: resolvedCampaignId },
      include: {
        campaignInfluencer: {
          include: {
            influencer: { select: { displayId: true, handle: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build CSV
    const headers = 'influencer_handle,influencer_id,capture_day,reach,impressions,engagement,clicks,source,captured_at';
    const rows = kpis.map((k) => {
      const handle = k.campaignInfluencer?.influencer?.handle || '';
      const infId = k.campaignInfluencer?.influencer?.displayId || '';
      return `${handle},${infId},${k.captureDay || ''},${k.reach || 0},${k.impressions || 0},${k.engagement || 0},${k.clicks || 0},${k.source || 'manual'},${k.createdAt.toISOString()}`;
    });

    const csv = [headers, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}-kpis.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting report as CSV:', error);
    res.status(500).json({ success: false, error: 'Failed to export CSV' });
  }
});

// ─── GET /campaigns/:campaignId/reports/:reportId/share — shareable link ────

router.get('/campaigns/:campaignId/reports/:reportId/share', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { reportId } = req.params;

    const report = await prisma.report.findFirst({
      where: { id: reportId, campaignId: resolvedCampaignId },
    });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Return existing shareable URL or generate new one
    let shareableUrl = report.shareableUrl;
    if (!shareableUrl) {
      const shareToken = crypto.randomBytes(24).toString('hex');
      shareableUrl = `${process.env.FRONTEND_URL || 'https://app.tikit.ae'}/reports/share/${shareToken}`;
      await prisma.report.update({
        where: { id: reportId },
        data: { shareableUrl },
      });
    }

    res.json({
      success: true,
      data: {
        id: report.id,
        shareableUrl,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ success: false, error: 'Failed to generate shareable link' });
  }
});

// ─── GET /reports — all reports across campaigns (Director/CM) ──────────────

router.get('/reports', requireAuthentication, async (req, res) => {
  try {
    const { status, campaignId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: {
              displayId: true,
              campaignName: true,
              client: { select: { companyName: true } },
              status: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    const formatted = reports.map((r) => {
      const hl = r.highlights ? JSON.parse(r.highlights) : {};
      return {
        ...r,
        kpiSummary: r.kpiSummary ? JSON.parse(r.kpiSummary) : null,
        highlights: hl.highlights || (Array.isArray(hl) ? hl : []),
        recommendations: hl.recommendations || [],
      };
    });

    res.json({
      success: true,
      data: {
        reports: formatted,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error listing all reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

module.exports = router;
