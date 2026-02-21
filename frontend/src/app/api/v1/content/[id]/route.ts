export const dynamic = 'force-dynamic';

// Content CRUD - Get, Update, Delete by ID
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/content/[id]
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: {
        collaboration: true,
      },
    });

    if (!content) {
      return errorResponse('Content not found', 404);
    }

    return successResponse(content);
  } catch (error: any) {
    console.error('Error fetching content:', error);
    return errorResponse('Failed to fetch content');
  }
});

// PUT /api/v1/content/[id]
export const PUT = withRole(['admin', 'client_manager'], async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.type !== undefined) updateData.type = body.type;
    if (body.version !== undefined) updateData.version = body.version;
    if (body.approvalStatus !== undefined) updateData.approvalStatus = body.approvalStatus;
    if (body.internalFeedback !== undefined) updateData.internalFeedback = body.internalFeedback;
    if (body.clientFeedback !== undefined) updateData.clientFeedback = body.clientFeedback;
    if (body.livePostUrl !== undefined) updateData.livePostUrl = body.livePostUrl;
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
    if (body.description !== undefined) updateData.description = body.description;

    const content = await prisma.content.update({
      where: { id: params.id },
      data: updateData,
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

    return successResponse(content, 'Content updated successfully');
  } catch (error: any) {
    console.error('Error updating content:', error);
    if (error.code === 'P2025') {
      return errorResponse('Content not found', 404);
    }
    return errorResponse('Failed to update content');
  }
});

// DELETE /api/v1/content/[id]
export const DELETE = withRole(['admin'], async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await prisma.content.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'Content deleted successfully');
  } catch (error: any) {
    console.error('Error deleting content:', error);
    if (error.code === 'P2025') {
      return errorResponse('Content not found', 404);
    }
    return errorResponse('Failed to delete content');
  }
});
