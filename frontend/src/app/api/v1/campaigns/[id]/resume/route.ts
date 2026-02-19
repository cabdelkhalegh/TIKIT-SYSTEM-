// Resume campaign
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    if (campaign.status !== 'paused') {
      return errorResponse('Only paused campaigns can be resumed', 400);
    }

    const updated = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: { status: 'active' },
      include: { client: true },
    });

    return successResponse(updated, 'Campaign resumed successfully');
  } catch (error: any) {
    console.error('Error resuming campaign:', error);
    return errorResponse('Failed to resume campaign');
  }
});
