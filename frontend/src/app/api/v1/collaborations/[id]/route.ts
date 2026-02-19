// Collaborations CRUD - Get, Update, Delete by ID
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';
import { canTransitionCollaborationStatus } from '@/lib/collaboration-helpers';

// GET /api/v1/collaborations/[id]
export const GET = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const collaboration = await prisma.campaignInfluencer.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          include: {
            client: true,
          },
        },
        influencer: true,
      },
    });

    if (!collaboration) {
      return errorResponse('Collaboration not found', 404);
    }

    return successResponse(collaboration);
  } catch (error: any) {
    console.error('Error fetching collaboration:', error);
    return errorResponse('Failed to fetch collaboration');
  }
});

// PUT /api/v1/collaborations/[id]
export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const body = await req.json();

    const existing = await prisma.campaignInfluencer.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return errorResponse('Collaboration not found', 404);
    }

    // Validate status transition
    if (body.collaborationStatus && body.collaborationStatus !== existing.collaborationStatus) {
      if (!canTransitionCollaborationStatus(existing.collaborationStatus, body.collaborationStatus)) {
        return errorResponse(
          `Cannot transition from ${existing.collaborationStatus} to ${body.collaborationStatus}`,
          400
        );
      }
    }

    const collaboration = await prisma.campaignInfluencer.update({
      where: { id: params.id },
      data: body,
      include: {
        campaign: true,
        influencer: true,
      },
    });

    return successResponse(collaboration, 'Collaboration updated successfully');
  } catch (error: any) {
    console.error('Error updating collaboration:', error);
    return errorResponse('Failed to update collaboration');
  }
});

// DELETE /api/v1/collaborations/[id]
export const DELETE = withRole(['admin'], async (req: NextRequest, { params }: any) => {
  try {
    await prisma.campaignInfluencer.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'Collaboration deleted successfully');
  } catch (error: any) {
    console.error('Error deleting collaboration:', error);
    if (error.code === 'P2025') {
      return errorResponse('Collaboration not found', 404);
    }
    return errorResponse('Failed to delete collaboration');
  }
});
