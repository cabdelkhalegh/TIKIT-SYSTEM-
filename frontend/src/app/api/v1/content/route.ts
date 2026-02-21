export const dynamic = 'force-dynamic';

// Content CRUD - List and Create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/content?collaborationId=:id - List content for a collaboration
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const collaborationId = searchParams.get('collaborationId');

    const where: any = {};
    if (collaborationId) {
      where.collaborationId = collaborationId;
    }

    const content = await prisma.content.findMany({
      where,
      include: {
        collaboration: {
          select: {
            id: true,
            campaignId: true,
            influencerId: true,
            collaborationStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(content);
  } catch (error: any) {
    console.error('Error fetching content:', error);
    return errorResponse('Failed to fetch content');
  }
});

// POST /api/v1/content - Create new content item
export const POST = withRole(['admin', 'client_manager'], async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();

    const content = await prisma.content.create({
      data: {
        type: body.type,
        version: body.version || 1,
        approvalStatus: body.approvalStatus || 'pending',
        internalFeedback: body.internalFeedback || null,
        clientFeedback: body.clientFeedback || null,
        livePostUrl: body.livePostUrl || null,
        fileUrl: body.fileUrl || null,
        description: body.description || null,
        collaborationId: body.collaborationId,
      },
      include: {
        collaboration: {
          select: {
            id: true,
            campaignId: true,
            influencerId: true,
            collaborationStatus: true,
          },
        },
      },
    });

    return successResponse(content, 'Content created successfully', 201);
  } catch (error: any) {
    console.error('Error creating content:', error);
    return errorResponse(error.message || 'Failed to create content', 500);
  }
});
