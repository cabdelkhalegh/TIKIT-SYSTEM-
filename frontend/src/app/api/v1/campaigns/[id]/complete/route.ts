export const dynamic = 'force-dynamic';

// Complete campaign
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

    if (!canTransitionStatus(campaign.status, 'completed')) {
      return errorResponse(
        `Cannot complete campaign with status ${campaign.status}`,
        400
      );
    }

    const updated = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: {
        status: 'completed',
        endDate: campaign.endDate || new Date(),
      },
      include: { client: true },
    });

    return successResponse(updated, 'Campaign completed successfully');
  } catch (error: any) {
    console.error('Error completing campaign:', error);
    return errorResponse('Failed to complete campaign');
  }
});
