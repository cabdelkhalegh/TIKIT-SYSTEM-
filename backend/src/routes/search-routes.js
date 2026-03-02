// T121: Search route — GET /search?q= returns campaigns + influencers filtered by role
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');

const prisma = new PrismaClient();

router.get('/search', requireAuthentication, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { campaigns: [], influencers: [] } });
    }

    const searchTerm = q.toString();

    // Search campaigns by name or displayId
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { campaignName: { contains: searchTerm, mode: 'insensitive' } },
          { displayId: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isDeleted: false,
      },
      select: {
        campaignId: true,
        campaignName: true,
        displayId: true,
        status: true,
        client: { select: { companyName: true } },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    // Search influencers by handle or fullName
    const influencers = await prisma.influencer.findMany({
      where: {
        OR: [
          { handle: { contains: searchTerm, mode: 'insensitive' } },
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { displayId: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        influencerId: true,
        handle: true,
        fullName: true,
        displayId: true,
        platform: true,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { campaigns, influencers },
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

module.exports = router;
