export const dynamic = 'force-dynamic';

// Brief CRUD — Get, Update, Delete by ID
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';

function extractBriefId(pathname: string): string {
  const parts = pathname.split('/briefs/');
  if (parts.length < 2) return '';
  // Remove any trailing path segments (like /extract)
  return parts[1].split('/')[0];
}

// GET /api/v1/campaigns/:campaignId/briefs/:briefId
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const briefId = extractBriefId(req.nextUrl.pathname);

    const brief = await prisma.brief.findUnique({ where: { id: briefId } });

    if (!brief) {
      return errorResponse('Brief not found', 404);
    }

    return successResponse(brief);
  } catch (error: any) {
    console.error('Error fetching brief:', error);
    return errorResponse('Failed to fetch brief');
  }
});

// PUT /api/v1/campaigns/:campaignId/briefs/:briefId
export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const briefId = extractBriefId(req.nextUrl.pathname);
    const body = await req.json();

    const updateData: any = {};
    const allowedFields = [
      'rawText', 'fileName', 'objectives', 'kpis', 'targetAudience',
      'keyMessages', 'contentPillars', 'matchingCriteria', 'strategy', 'aiStatus',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const brief = await prisma.brief.update({
      where: { id: briefId },
      data: updateData,
    });

    return successResponse(brief, 'Brief updated successfully');
  } catch (error: any) {
    console.error('Error updating brief:', error);
    if (error.code === 'P2025') {
      return errorResponse('Brief not found', 404);
    }
    return errorResponse('Failed to update brief');
  }
});

// DELETE /api/v1/campaigns/:campaignId/briefs/:briefId
export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const briefId = extractBriefId(req.nextUrl.pathname);

    await prisma.brief.delete({ where: { id: briefId } });

    return successResponse(null, 'Brief deleted successfully');
  } catch (error: any) {
    console.error('Error deleting brief:', error);
    if (error.code === 'P2025') {
      return errorResponse('Brief not found', 404);
    }
    return errorResponse('Failed to delete brief');
  }
});
