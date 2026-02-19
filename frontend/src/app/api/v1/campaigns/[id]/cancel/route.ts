export const dynamic = 'force-dynamic';

// Cancel campaign
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { canTransitionStatus } from '@/lib/campaign-helpers';

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    if (!canTransitionStatus(campaign.status, 'cancelled')) {
      return errorResponse(
        `Cannot cancel campaign with status ${campaign.status}`,
        400
      );
    }

    const updated = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: { status: 'cancelled' },
      include: { client: true },
    });

    return successResponse(
      { ...updated, reason: reason || 'No reason provided' },
      'Campaign cancelled successfully'
    );
  } catch (error: any) {
    console.error('Error cancelling campaign:', error);
    return errorResponse('Failed to cancel campaign');
  }
});
