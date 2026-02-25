// Brief Routes — Campaign brief upload + Gemini AI extraction
// Slice 5 + T035 enhancements (re-extract, review, versions, auto-versioning, auto-link client)

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { requireAuthentication } = require('../middleware/access-control');
const asyncHandler = require('../middleware/async-handler');
const { extractBrief } = require('../services/gemini-service');

const prisma = new PrismaClient();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(requireAuthentication);

// GET /campaigns/:campaignId/briefs — list briefs for a campaign
router.get(
  '/campaigns/:campaignId/briefs',
  asyncHandler(async (req, res) => {
    const { campaignId } = req.params;

    const briefs = await prisma.brief.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: briefs });
  })
);

// POST /campaigns/:campaignId/briefs — create brief from pasted text
router.post(
  '/campaigns/:campaignId/briefs',
  asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const { rawText, fileName } = req.body;

    // Get next version number
    const lastBrief = await prisma.brief.findFirst({
      where: { campaignId },
      orderBy: { version: 'desc' },
    });
    const version = (lastBrief?.version || 0) + 1;

    const brief = await prisma.brief.create({
      data: {
        campaignId,
        rawText: rawText || null,
        fileName: fileName || null,
        version,
      },
    });

    res.status(201).json({ success: true, data: brief, message: 'Brief created successfully' });
  })
);

// POST /campaigns/:campaignId/briefs/upload — upload file and extract text
router.post(
  '/campaigns/:campaignId/briefs/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { campaignId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Extract text from file buffer
    let rawText;
    if (mimetype === 'application/pdf') {
      // Basic PDF text extraction using latin1 encoding
      rawText = buffer.toString('latin1');
    } else {
      rawText = buffer.toString('utf8');
    }

    // Get next version number
    const lastBrief = await prisma.brief.findFirst({
      where: { campaignId },
      orderBy: { version: 'desc' },
    });
    const version = (lastBrief?.version || 0) + 1;

    const brief = await prisma.brief.create({
      data: {
        campaignId,
        rawText,
        fileName: originalname,
        version,
      },
    });

    res.status(201).json({ success: true, data: brief, message: 'Brief uploaded successfully' });
  })
);

// GET /campaigns/:campaignId/briefs/:id — get single brief
router.get(
  '/campaigns/:campaignId/briefs/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const brief = await prisma.brief.findUnique({ where: { id } });

    if (!brief) {
      return res.status(404).json({ success: false, error: 'Brief not found' });
    }

    res.json({ success: true, data: brief });
  })
);

// PUT /campaigns/:campaignId/briefs/:id — update brief
// T035: Auto-create BriefVersion with previous state before applying update (§VII append-only)
router.put(
  '/campaigns/:campaignId/briefs/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Fetch current state before update
    const currentBrief = await prisma.brief.findUnique({ where: { id } });
    if (!currentBrief) {
      return res.status(404).json({ success: false, error: 'Brief not found' });
    }

    // Create BriefVersion snapshot of previous state (append-only per §VII)
    await prisma.briefVersion.create({
      data: {
        briefId: id,
        versionNumber: currentBrief.version || 1,
        objectives: currentBrief.objectives,
        kpis: currentBrief.kpis,
        targetAudience: currentBrief.targetAudience,
        deliverables: currentBrief.deliverables,
        budgetSignals: currentBrief.budgetSignals,
        clientInfo: currentBrief.clientInfo,
        keyMessages: currentBrief.keyMessages,
        contentPillars: currentBrief.contentPillars,
        matchingCriteria: currentBrief.matchingCriteria,
        changedBy: req.user?.userId || null,
      },
    });

    const updateData = {};
    const allowedFields = [
      'rawText', 'fileName', 'objectives', 'kpis', 'targetAudience',
      'deliverables', 'budgetSignals', 'clientInfo',
      'keyMessages', 'contentPillars', 'matchingCriteria', 'strategy', 'aiStatus',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Increment version
    updateData.version = (currentBrief.version || 1) + 1;

    const brief = await prisma.brief.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: brief, message: 'Brief updated successfully' });
  })
);

// DELETE /campaigns/:campaignId/briefs/:id — delete brief
router.delete(
  '/campaigns/:campaignId/briefs/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.brief.delete({ where: { id } });

    res.json({ success: true, data: null, message: 'Brief deleted successfully' });
  })
);

// POST /campaigns/:campaignId/briefs/:id/extract — AI extraction with Gemini
// T035: Now uses centralized gemini-service, stores confidence scores, auto-links client
router.post(
  '/campaigns/:campaignId/briefs/:id/extract',
  asyncHandler(async (req, res) => {
    const { campaignId, id } = req.params;

    const brief = await prisma.brief.findUnique({ where: { id } });
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Brief not found' });
    }

    if (!brief.rawText) {
      return res.status(400).json({ success: false, error: 'Brief has no raw text to extract from' });
    }

    // Update status to extracting
    await prisma.brief.update({
      where: { id },
      data: { aiStatus: 'extracting', extractionStatus: 'processing' },
    });

    // Use centralized gemini-service for extraction
    const extraction = await extractBrief(brief.rawText);

    if (!extraction.success) {
      const failed = await prisma.brief.update({
        where: { id },
        data: { aiStatus: 'failed', extractionStatus: 'failed' },
      });
      return res.status(500).json({
        success: false,
        error: `AI extraction failed: ${extraction.error}`,
        fallbackRequired: true,
        data: failed,
      });
    }

    const parsed = extraction.data;

    // Store extracted fields — serialize objects/arrays to JSON strings for DB
    const updated = await prisma.brief.update({
      where: { id },
      data: {
        objectives: parsed.objectives ? JSON.stringify(parsed.objectives) : null,
        kpis: parsed.kpis ? JSON.stringify(parsed.kpis) : null,
        targetAudience: parsed.targetAudience ? JSON.stringify(parsed.targetAudience) : null,
        deliverables: parsed.deliverables ? JSON.stringify(parsed.deliverables) : null,
        budgetSignals: parsed.budgetSignals ? JSON.stringify(parsed.budgetSignals) : null,
        clientInfo: parsed.clientInfo ? JSON.stringify(parsed.clientInfo) : null,
        keyMessages: parsed.keyMessages ? JSON.stringify(parsed.keyMessages) : null,
        contentPillars: parsed.contentPillars ? JSON.stringify(parsed.contentPillars) : null,
        matchingCriteria: parsed.matchingCriteria ? JSON.stringify(parsed.matchingCriteria) : null,
        confidenceScores: parsed.confidenceScores ? JSON.stringify(parsed.confidenceScores) : null,
        aiStatus: 'extracted',
        extractionStatus: 'completed',
      },
    });

    // T035: Auto-link client — if clientInfo.companyName exists, find or create Client
    if (parsed.clientInfo?.companyName) {
      try {
        let client = await prisma.client.findFirst({
          where: { brandDisplayName: parsed.clientInfo.companyName },
        });
        if (!client) {
          client = await prisma.client.create({
            data: {
              brandDisplayName: parsed.clientInfo.companyName,
              legalCompanyName: parsed.clientInfo.companyName,
              contactPersonName: parsed.clientInfo.contactName || null,
              contactEmail: parsed.clientInfo.contactEmail || null,
            },
          });
        }
        // Link client to campaign if not already linked
        const campaign = await prisma.campaign.findUnique({ where: { campaignId } });
        if (campaign && !campaign.clientId) {
          await prisma.campaign.update({
            where: { campaignId },
            data: { clientId: client.clientId },
          });
        }
      } catch (clientError) {
        console.error('Auto-link client error (non-fatal):', clientError.message);
      }
    }

    res.json({ success: true, data: updated, message: 'Brief extracted successfully' });
  })
);

// POST /campaigns/:campaignId/briefs/:id/re-extract — T035: re-run Gemini extraction
router.post(
  '/campaigns/:campaignId/briefs/:id/re-extract',
  asyncHandler(async (req, res) => {
    const { campaignId, id } = req.params;

    const brief = await prisma.brief.findUnique({ where: { id } });
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Brief not found' });
    }

    if (!brief.rawText && !brief.fileUrl) {
      return res.status(400).json({ success: false, error: 'Brief has no raw text or file to extract from' });
    }

    // Create BriefVersion snapshot before re-extraction (append-only per §VII)
    await prisma.briefVersion.create({
      data: {
        briefId: id,
        versionNumber: brief.version || 1,
        objectives: brief.objectives,
        kpis: brief.kpis,
        targetAudience: brief.targetAudience,
        deliverables: brief.deliverables,
        budgetSignals: brief.budgetSignals,
        clientInfo: brief.clientInfo,
        keyMessages: brief.keyMessages,
        contentPillars: brief.contentPillars,
        matchingCriteria: brief.matchingCriteria,
        changedBy: req.user?.userId || null,
      },
    });

    // Update status to extracting
    await prisma.brief.update({
      where: { id },
      data: { aiStatus: 'extracting', extractionStatus: 'processing' },
    });

    const extraction = await extractBrief(brief.rawText);

    if (!extraction.success) {
      const failed = await prisma.brief.update({
        where: { id },
        data: { aiStatus: 'failed', extractionStatus: 'failed' },
      });
      return res.status(500).json({
        success: false,
        error: `AI re-extraction failed: ${extraction.error}`,
        fallbackRequired: true,
        data: failed,
      });
    }

    const parsed = extraction.data;
    const updated = await prisma.brief.update({
      where: { id },
      data: {
        objectives: parsed.objectives ? JSON.stringify(parsed.objectives) : null,
        kpis: parsed.kpis ? JSON.stringify(parsed.kpis) : null,
        targetAudience: parsed.targetAudience ? JSON.stringify(parsed.targetAudience) : null,
        deliverables: parsed.deliverables ? JSON.stringify(parsed.deliverables) : null,
        budgetSignals: parsed.budgetSignals ? JSON.stringify(parsed.budgetSignals) : null,
        clientInfo: parsed.clientInfo ? JSON.stringify(parsed.clientInfo) : null,
        keyMessages: parsed.keyMessages ? JSON.stringify(parsed.keyMessages) : null,
        contentPillars: parsed.contentPillars ? JSON.stringify(parsed.contentPillars) : null,
        matchingCriteria: parsed.matchingCriteria ? JSON.stringify(parsed.matchingCriteria) : null,
        confidenceScores: parsed.confidenceScores ? JSON.stringify(parsed.confidenceScores) : null,
        aiStatus: 'extracted',
        extractionStatus: 'completed',
        version: (brief.version || 1) + 1,
      },
    });

    res.json({ success: true, data: updated, message: 'Brief re-extracted successfully' });
  })
);

// POST /campaigns/:campaignId/briefs/:id/review — T035: mark brief as reviewed
router.post(
  '/campaigns/:campaignId/briefs/:id/review',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const brief = await prisma.brief.findUnique({ where: { id } });
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Brief not found' });
    }

    if (brief.extractionStatus !== 'completed' && brief.aiStatus !== 'extracted') {
      return res.status(400).json({ success: false, error: 'Extraction must be completed before review' });
    }

    const updated = await prisma.brief.update({
      where: { id },
      data: {
        isReviewed: true,
        reviewedBy: req.user?.userId || null,
      },
    });

    res.json({ success: true, data: updated, message: 'Brief marked as reviewed' });
  })
);

// GET /campaigns/:campaignId/briefs/:id/versions — T035: version history
router.get(
  '/campaigns/:campaignId/briefs/:id/versions',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const brief = await prisma.brief.findUnique({ where: { id } });
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Brief not found' });
    }

    const versions = await prisma.briefVersion.findMany({
      where: { briefId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { briefId: id, versions } });
  })
);

// POST /briefs/analyze — standalone AI analysis (no DB save)
// Accepts { text } JSON body OR multipart file upload
router.post(
  '/briefs/analyze',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    let rawText = req.body?.text || null;

    // If a file was uploaded, extract text from it
    if (req.file) {
      const { buffer, mimetype } = req.file;
      if (mimetype === 'application/pdf') {
        rawText = buffer.toString('latin1');
      } else {
        rawText = buffer.toString('utf8');
      }
    }

    if (!rawText) {
      return res.status(400).json({ success: false, error: 'No text or file provided for analysis' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `Analyze this campaign brief and extract the following as JSON with these exact keys:
campaignName (string — a short campaign title derived from the brief),
description (string — a 1-2 sentence campaign description),
objectives (array of strings),
targetAudience (string — describe the target audience),
kpis (string — key performance indicators mentioned),
keyMessages (string — key messages or themes),
contentPillars (string — content pillars if any),
matchingCriteria (string — influencer matching criteria if any),
strategy (string — overall campaign strategy),
suggestedBudget (number or null — budget in USD if mentioned).
Return ONLY valid JSON, no markdown.
Brief text: ${rawText}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      let parsed;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        parsed = JSON.parse(responseText.trim());
      }

      res.json({ success: true, data: parsed });
    } catch (error) {
      console.error('Brief analysis error:', error);
      res.status(500).json({
        success: false,
        error: `AI analysis failed: ${error.message}`,
      });
    }
  })
);

module.exports = router;
