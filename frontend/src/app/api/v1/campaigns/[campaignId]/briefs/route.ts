export const dynamic = 'force-dynamic';

// Briefs CRUD — List and Create
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/campaigns/:campaignId/briefs
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const campaignId = req.nextUrl.pathname.split('/campaigns/')[1].split('/briefs')[0];

    const briefs = await prisma.brief.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(briefs);
  } catch (error: any) {
    console.error('Error fetching briefs:', error);
    return errorResponse('Failed to fetch briefs');
  }
});

// POST /api/v1/campaigns/:campaignId/briefs
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const campaignId = req.nextUrl.pathname.split('/campaigns/')[1].split('/briefs')[0];
    const body = await req.json();

    // Get next version number
    const lastBrief = await prisma.brief.findFirst({
      where: { campaignId },
      orderBy: { version: 'desc' },
    });
    const version = (lastBrief?.version || 0) + 1;

    const brief = await prisma.brief.create({
      data: {
        campaignId,
        rawText: body.rawText || null,
        fileName: body.fileName || null,
        version,
      },
    });

    return successResponse(brief, 'Brief created successfully', 201);
  } catch (error: any) {
    console.error('Error creating brief:', error);
    return errorResponse(error.message || 'Failed to create brief');
  }
});
