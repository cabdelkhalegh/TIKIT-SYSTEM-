// Brief Routes — Campaign brief upload + Gemini AI extraction
// Slice 5

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { requireAuthentication } = require('../middleware/access-control');
const asyncHandler = require('../middleware/async-handler');

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
router.put(
  '/campaigns/:campaignId/briefs/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {};

    const allowedFields = [
      'rawText', 'fileName', 'objectives', 'kpis', 'targetAudience',
      'keyMessages', 'contentPillars', 'matchingCriteria', 'strategy', 'aiStatus',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

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
router.post(
  '/campaigns/:campaignId/briefs/:id/extract',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

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
      data: { aiStatus: 'extracting' },
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `Analyze this campaign brief and extract the following as JSON with these exact keys: objectives (string), kpis (string), targetAudience (string), keyMessages (string), contentPillars (string), matchingCriteria (string), strategy (string). Brief text: ${brief.rawText}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse JSON from response — handle markdown code blocks
      let parsed;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        parsed = JSON.parse(responseText.trim());
      }

      const updated = await prisma.brief.update({
        where: { id },
        data: {
          objectives: parsed.objectives || null,
          kpis: parsed.kpis || null,
          targetAudience: parsed.targetAudience || null,
          keyMessages: parsed.keyMessages || null,
          contentPillars: parsed.contentPillars || null,
          matchingCriteria: parsed.matchingCriteria || null,
          strategy: parsed.strategy || null,
          aiStatus: 'extracted',
        },
      });

      res.json({ success: true, data: updated, message: 'Brief extracted successfully' });
    } catch (error) {
      console.error('Gemini extraction error:', error);

      const failed = await prisma.brief.update({
        where: { id },
        data: { aiStatus: 'failed' },
      });

      res.status(500).json({
        success: false,
        error: `AI extraction failed: ${error.message}`,
        data: failed,
      });
    }
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
