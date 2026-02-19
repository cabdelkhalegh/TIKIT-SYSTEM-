export const dynamic = 'force-dynamic';

// Activate campaign
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { canTransitionStatus } from '@/lib/campaign-helpers';

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    if (!canTransitionStatus(campaign.status, 'active')) {
      return errorResponse(
        `Cannot activate campaign with status ${campaign.status}`,
        400
      );
    }

    const updated = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: {
        status: 'active',
        launchDate: campaign.launchDate || new Date(),
      },
      include: {
        client: true,
      },
    });

    return successResponse(updated, 'Campaign activated successfully');
  } catch (error: any) {
    console.error('Error activating campaign:', error);
    return errorResponse('Failed to activate campaign');
  }
});
