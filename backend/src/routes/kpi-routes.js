// T079: KPI Routes — manual entry, list, summary, schedules, auto-capture trigger
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const instagramService = require('../services/instagram-service');

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

// ─── POST /campaigns/:campaignId/kpis — manual KPI entry ─────────────────────

router.post('/campaigns/:campaignId/kpis', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { campaignInfluencerId, reach, impressions, engagement, clicks, captureDay } = req.body;

    if (!campaignInfluencerId) {
      return res.status(400).json({ success: false, error: 'campaignInfluencerId is required' });
    }

    if (!reach && !impressions && !engagement && !clicks) {
      return res.status(400).json({
        success: false,
        error: 'At least one metric (reach, impressions, engagement, clicks) is required',
      });
    }

    // Verify campaign influencer exists and belongs to this campaign
    const ci = await prisma.campaignInfluencer.findFirst({
      where: { id: campaignInfluencerId, campaignId: resolvedCampaignId },
    });
    if (!ci) {
      return res.status(404).json({ success: false, error: 'Campaign influencer not found' });
    }

    const kpi = await prisma.kPI.create({
      data: {
        campaignId: resolvedCampaignId,
        campaignInfluencerId,
        reach: reach ? parseInt(reach, 10) : null,
        impressions: impressions ? parseInt(impressions, 10) : null,
        engagement: engagement ? parseInt(engagement, 10) : null,
        clicks: clicks ? parseInt(clicks, 10) : null,
        captureDay: captureDay ? parseInt(captureDay, 10) : null,
        source: 'manual',
      },
    });

    res.status(201).json({ success: true, data: kpi });
  } catch (error) {
    console.error('Error creating KPI entry:', error);
    res.status(500).json({ success: false, error: 'Failed to create KPI entry' });
  }
});

// ─── GET /campaigns/:campaignId/kpis — list KPIs ─────────────────────────────

router.get('/campaigns/:campaignId/kpis', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { campaignInfluencerId, captureDay, source, sortBy, sortOrder } = req.query;

    const where = { campaignId: resolvedCampaignId };
    if (campaignInfluencerId) where.campaignInfluencerId = campaignInfluencerId;
    if (captureDay) where.captureDay = parseInt(captureDay, 10);
    if (source) where.source = source;

    const orderField = sortBy === 'captureDay' ? 'captureDay' : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const kpis = await prisma.kPI.findMany({
      where,
      orderBy: { [orderField]: orderDir },
      include: {
        campaignInfluencer: {
          include: {
            influencer: {
              select: { influencerId: true, displayId: true, handle: true, fullName: true },
            },
          },
        },
      },
    });

    const formatted = kpis.map((k) => ({
      id: k.id,
      campaignInfluencerId: k.campaignInfluencerId,
      influencer: k.campaignInfluencer
        ? {
            id: k.campaignInfluencer.influencer.influencerId,
            displayId: k.campaignInfluencer.influencer.displayId,
            handle: k.campaignInfluencer.influencer.handle,
            fullName: k.campaignInfluencer.influencer.fullName,
          }
        : null,
      reach: k.reach,
      impressions: k.impressions,
      engagement: k.engagement,
      clicks: k.clicks,
      captureDay: k.captureDay,
      source: k.source,
      createdAt: k.createdAt,
    }));

    res.json({
      success: true,
      data: { campaignId: resolvedCampaignId, kpis: formatted, count: formatted.length },
    });
  } catch (error) {
    console.error('Error listing KPIs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KPIs' });
  }
});

// ─── GET /campaigns/:campaignId/kpis/summary — aggregated ────────────────────

router.get('/campaigns/:campaignId/kpis/summary', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: resolvedCampaignId },
    });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Get all KPIs for this campaign
    const kpis = await prisma.kPI.findMany({
      where: { campaignId: resolvedCampaignId },
      include: {
        campaignInfluencer: {
          include: {
            influencer: {
              select: { influencerId: true, displayId: true, handle: true },
            },
          },
        },
      },
    });

    // Get schedules for stats
    const schedules = await prisma.kPISchedule.findMany({
      where: { campaignId: resolvedCampaignId },
    });

    // Aggregate totals using latest capture day per influencer
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
        campaignInfluencerId: ciId,
        handle: k.campaignInfluencer?.influencer?.handle || null,
        displayId: k.campaignInfluencer?.influencer?.displayId || null,
        latestCapture: {
          captureDay: k.captureDay,
          reach: k.reach,
          impressions: k.impressions,
          engagement: k.engagement,
          clicks: k.clicks,
          source: k.source,
        },
      });
    }

    // Aggregate by capture day
    const byCaptureDay = { day1: { reach: 0, impressions: 0, engagement: 0, clicks: 0 }, day3: { reach: 0, impressions: 0, engagement: 0, clicks: 0 }, day7: { reach: 0, impressions: 0, engagement: 0, clicks: 0 } };
    for (const k of kpis) {
      const key = k.captureDay === 1 ? 'day1' : k.captureDay === 3 ? 'day3' : k.captureDay === 7 ? 'day7' : null;
      if (key) {
        byCaptureDay[key].reach += k.reach || 0;
        byCaptureDay[key].impressions += k.impressions || 0;
        byCaptureDay[key].engagement += k.engagement || 0;
        byCaptureDay[key].clicks += k.clicks || 0;
      }
    }

    const capturedCount = schedules.filter((s) => s.capturedAt).length;
    const pendingCount = schedules.filter((s) => !s.capturedAt && !s.isFailed).length;

    const avgEngRate = totalReach > 0 ? Math.round((totalEngagement / totalReach) * 100 * 100) / 100 : 0;

    res.json({
      success: true,
      data: {
        campaignId: resolvedCampaignId,
        summary: {
          totalReach,
          totalImpressions,
          totalEngagement,
          totalClicks,
          averageEngagementRate: avgEngRate,
          influencerCount: byInfluencerMap.size,
          capturedCount,
          pendingCount,
        },
        byInfluencer,
        byCaptureDay,
      },
    });
  } catch (error) {
    console.error('Error fetching KPI summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KPI summary' });
  }
});

// ─── GET /campaigns/:campaignId/kpis/schedules — list schedules ───────────────

router.get('/campaigns/:campaignId/kpis/schedules', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);

    const schedules = await prisma.kPISchedule.findMany({
      where: { campaignId: resolvedCampaignId },
      orderBy: { scheduledAt: 'asc' },
      include: {
        campaign: {
          select: {
            campaignInfluencers: {
              select: {
                id: true,
                influencer: {
                  select: { displayId: true, handle: true },
                },
              },
            },
          },
        },
      },
    });

    // Build influencer lookup from campaign's influencers
    const influencerMap = new Map();
    if (schedules.length > 0) {
      for (const ci of schedules[0].campaign.campaignInfluencers) {
        influencerMap.set(ci.id, {
          displayId: ci.influencer.displayId,
          handle: ci.influencer.handle,
        });
      }
    }

    const formatted = schedules.map((s) => ({
      id: s.id,
      campaignInfluencerId: s.campaignInfluencerId,
      influencer: influencerMap.get(s.campaignInfluencerId) || null,
      captureDay: s.captureDay,
      scheduledAt: s.scheduledAt,
      capturedAt: s.capturedAt,
      isFailed: s.isFailed,
    }));

    const total = formatted.length;
    const completed = formatted.filter((s) => s.capturedAt).length;
    const pending = formatted.filter((s) => !s.capturedAt && !s.isFailed).length;
    const failed = formatted.filter((s) => s.isFailed).length;

    res.json({
      success: true,
      data: {
        campaignId: resolvedCampaignId,
        schedules: formatted,
        stats: { total, completed, pending, failed },
      },
    });
  } catch (error) {
    console.error('Error listing KPI schedules:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KPI schedules' });
  }
});

// ─── POST /campaigns/:campaignId/kpis/auto-capture — trigger auto-capture ────

router.post('/campaigns/:campaignId/kpis/auto-capture', requireAuthentication, async (req, res) => {
  try {
    const resolvedCampaignId = await resolveCampaignId(req.params.campaignId);
    const { campaignInfluencerId } = req.body;

    if (campaignInfluencerId) {
      // Trigger for a specific influencer
      const ci = await prisma.campaignInfluencer.findFirst({
        where: { id: campaignInfluencerId, campaignId: resolvedCampaignId },
        include: {
          influencer: { select: { influencerId: true, handle: true } },
        },
      });
      if (!ci) {
        return res.status(404).json({ success: false, error: 'Campaign influencer not found' });
      }

      // Check for live post URL in content
      const liveContent = await prisma.content.findFirst({
        where: { collaborationId: ci.id, livePostUrl: { not: null } },
      });
      if (!liveContent) {
        return res.status(400).json({ success: false, error: 'Influencer does not have a live post URL' });
      }

      // Attempt capture via Instagram service
      try {
        const metrics = await instagramService.captureKPIs(ci.influencer.handle);

        const kpi = await prisma.kPI.create({
          data: {
            campaignId: resolvedCampaignId,
            campaignInfluencerId: ci.id,
            reach: metrics.reach,
            impressions: metrics.impressions,
            engagement: metrics.engagement,
            clicks: metrics.clicks,
            source: 'auto',
          },
        });

        // Mark any pending schedule as captured
        await prisma.kPISchedule.updateMany({
          where: {
            campaignId: resolvedCampaignId,
            campaignInfluencerId: ci.id,
            capturedAt: null,
            isFailed: false,
            scheduledAt: { lte: new Date() },
          },
          data: { capturedAt: new Date() },
        });

        return res.json({
          success: true,
          data: {
            ...kpi,
            message: 'KPIs captured successfully from Instagram',
          },
        });
      } catch (captureErr) {
        return res.status(503).json({
          success: false,
          error: 'Instagram API is unavailable. KPI capture failed — please try again or enter manually.',
        });
      }
    }

    // Bulk: process all due schedules for this campaign
    const dueSchedules = await prisma.kPISchedule.findMany({
      where: {
        campaignId: resolvedCampaignId,
        capturedAt: null,
        isFailed: false,
        scheduledAt: { lte: new Date() },
      },
    });

    const results = [];
    for (const schedule of dueSchedules) {
      try {
        const ci = await prisma.campaignInfluencer.findUnique({
          where: { id: schedule.campaignInfluencerId },
          include: { influencer: { select: { handle: true } } },
        });
        if (!ci) {
          await prisma.kPISchedule.update({
            where: { id: schedule.id },
            data: { isFailed: true },
          });
          results.push({ scheduleId: schedule.id, status: 'failed', error: 'Influencer not found' });
          continue;
        }

        const metrics = await instagramService.captureKPIs(ci.influencer.handle);

        await prisma.kPI.create({
          data: {
            campaignId: resolvedCampaignId,
            campaignInfluencerId: schedule.campaignInfluencerId,
            reach: metrics.reach,
            impressions: metrics.impressions,
            engagement: metrics.engagement,
            clicks: metrics.clicks,
            captureDay: schedule.captureDay,
            source: 'auto',
          },
        });

        await prisma.kPISchedule.update({
          where: { id: schedule.id },
          data: { capturedAt: new Date() },
        });

        results.push({ scheduleId: schedule.id, status: 'captured' });
      } catch (err) {
        await prisma.kPISchedule.update({
          where: { id: schedule.id },
          data: { isFailed: true },
        });
        results.push({ scheduleId: schedule.id, status: 'failed', error: err.message });
      }
    }

    res.json({
      success: true,
      data: {
        processed: results.length,
        captured: results.filter((r) => r.status === 'captured').length,
        failed: results.filter((r) => r.status === 'failed').length,
        results,
      },
    });
  } catch (error) {
    console.error('Error triggering auto-capture:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger auto-capture' });
  }
});

module.exports = router;
