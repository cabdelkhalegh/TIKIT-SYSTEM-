// Get campaign influencers
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export const GET = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const campaignInfluencers = await prisma.campaignInfluencer.findMany({
      where: { campaignId: params.id },
      include: {
        influencer: true,
      },
    });

    return successResponse(campaignInfluencers);
  } catch (error: any) {
    console.error('Error fetching campaign influencers:', error);
    return errorResponse('Failed to fetch campaign influencers');
  }
});
