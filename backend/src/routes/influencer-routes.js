// Influencer Management Routes
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication, requireRole } = require('../middleware/access-control');

const prisma = new PrismaClient();

// List all influencers (authenticated users only)
router.get('/', requireAuthentication, async (req, res) => {
  try {
    const { platform, status, verified } = req.query;
    
    const whereClause = {};
    if (platform) whereClause.primaryPlatform = platform;
    if (status) whereClause.availabilityStatus = status;
    if (verified !== undefined) whereClause.isVerified = verified === 'true';
    
    const influencerList = await prisma.influencer.findMany({
      where: whereClause,
      include: {
        campaignInfluencers: {
          include: {
            campaign: {
              select: {
                campaignId: true,
                campaignName: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        qualityScore: 'desc'
      }
    });
    
    res.json({
      success: true,
      data: influencerList,
      count: influencerList.length
    });
  } catch (err) {
    console.error('Error fetching influencers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch influencers'
    });
  }
});

// Get single influencer by ID (authenticated users only)
router.get('/:id', requireAuthentication, async (req, res) => {
  try {
    const influencerRecord = await prisma.influencer.findUnique({
      where: { influencerId: req.params.id },
      include: {
        campaignInfluencers: {
          include: {
            campaign: {
              include: {
                client: {
                  select: {
                    clientId: true,
                    brandDisplayName: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!influencerRecord) {
      return res.status(404).json({
        success: false,
        error: 'Influencer not found'
      });
    }
    
    res.json({
      success: true,
      data: influencerRecord
    });
  } catch (err) {
    console.error('Error fetching influencer:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch influencer'
    });
  }
});

// Create new influencer (admin or influencer_manager only)
router.post('/', requireAuthentication, requireRole(['admin', 'influencer_manager']), async (req, res) => {
  try {
    const newInfluencer = await prisma.influencer.create({
      data: req.body
    });
    
    res.status(201).json({
      success: true,
      data: newInfluencer
    });
  } catch (err) {
    console.error('Error creating influencer:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create influencer'
    });
  }
});

// Update influencer (admin or influencer_manager only)
router.put('/:id', requireAuthentication, requireRole(['admin', 'influencer_manager']), async (req, res) => {
  try {
    const updatedInfluencer = await prisma.influencer.update({
      where: { influencerId: req.params.id },
      data: req.body
    });
    
    res.json({
      success: true,
      data: updatedInfluencer
    });
  } catch (err) {
    console.error('Error updating influencer:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update influencer'
    });
  }
});

// Delete influencer (admin only)
router.delete('/:id', requireAuthentication, requireRole(['admin']), async (req, res) => {
  try {
    await prisma.influencer.delete({
      where: { influencerId: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Influencer deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting influencer:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete influencer'
    });
  }
});

module.exports = router;
