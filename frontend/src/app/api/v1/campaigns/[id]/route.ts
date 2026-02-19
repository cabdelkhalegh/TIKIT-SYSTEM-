export const dynamic = 'force-dynamic';

// Campaigns CRUD - Get, Update, Delete by ID
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';
import { canTransitionStatus } from '@/lib/campaign-helpers';

// GET /api/v1/campaigns/[id]
export const GET = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
      include: {
        client: true,
        campaignInfluencers: {
          include: {
            influencer: {
              select: {
                influencerId: true,
                displayName: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    return successResponse(campaign);
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    return errorResponse('Failed to fetch campaign');
  }
});

// PUT /api/v1/campaigns/[id]
export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const body = await req.json();

    // If status is being changed, validate transition
    if (body.status) {
      const existing = await prisma.campaign.findUnique({
        where: { campaignId: params.id },
      });

      if (existing && body.status !== existing.status) {
        if (!canTransitionStatus(existing.status, body.status)) {
          return errorResponse(
            `Cannot transition campaign from ${existing.status} to ${body.status}`,
            400
          );
        }
      }
    }

    const campaign = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: body,
      include: {
        client: true,
      },
    });

    return successResponse(campaign, 'Campaign updated successfully');
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    if (error.code === 'P2025') {
      return errorResponse('Campaign not found', 404);
    }
    return errorResponse('Failed to update campaign');
  }
});

// DELETE /api/v1/campaigns/[id]
export const DELETE = withRole(['admin'], async (req: NextRequest, { params }: any) => {
  try {
    await prisma.campaign.delete({
      where: { campaignId: params.id },
    });

    return successResponse(null, 'Campaign deleted successfully');
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    if (error.code === 'P2025') {
      return errorResponse('Campaign not found', 404);
    }
    return errorResponse('Failed to delete campaign');
  }
});
