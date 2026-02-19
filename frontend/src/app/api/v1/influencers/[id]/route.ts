export const dynamic = 'force-dynamic';

// Influencers CRUD - Get, Update, Delete by ID
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/influencers/[id]
export const GET = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const influencer = await prisma.influencer.findUnique({
      where: { influencerId: params.id },
      include: {
        campaignInfluencers: {
          include: {
            campaign: {
              include: {
                client: {
                  select: {
                    clientId: true,
                    brandDisplayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!influencer) {
      return errorResponse('Influencer not found', 404);
    }

    return successResponse(influencer);
  } catch (error: any) {
    console.error('Error fetching influencer:', error);
    return errorResponse('Failed to fetch influencer');
  }
});

// PUT /api/v1/influencers/[id]
export const PUT = withRole(['admin', 'influencer_manager'], async (req: NextRequest, { params }: any) => {
  try {
    const body = await req.json();

    const influencer = await prisma.influencer.update({
      where: { influencerId: params.id },
      data: body,
    });

    return successResponse(influencer, 'Influencer updated successfully');
  } catch (error: any) {
    console.error('Error updating influencer:', error);
    if (error.code === 'P2025') {
      return errorResponse('Influencer not found', 404);
    }
    return errorResponse('Failed to update influencer');
  }
});

// DELETE /api/v1/influencers/[id]
export const DELETE = withRole(['admin'], async (req: NextRequest, { params }: any) => {
  try {
    await prisma.influencer.delete({
      where: { influencerId: params.id },
    });

    return successResponse(null, 'Influencer deleted successfully');
  } catch (error: any) {
    console.error('Error deleting influencer:', error);
    if (error.code === 'P2025') {
      return errorResponse('Influencer not found', 404);
    }
    return errorResponse('Failed to delete influencer');
  }
});
