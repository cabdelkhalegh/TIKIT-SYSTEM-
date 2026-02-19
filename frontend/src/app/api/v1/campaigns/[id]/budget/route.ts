export const dynamic = 'force-dynamic';

// Get campaign budget
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export const GET = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
      select: {
        campaignId: true,
        campaignName: true,
        totalBudget: true,
        allocatedBudget: true,
        spentBudget: true,
        status: true,
      },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    const budgetRemaining = (campaign.totalBudget || 0) - (campaign.spentBudget || 0);
    const budgetUtilization = campaign.totalBudget && campaign.totalBudget > 0
      ? parseFloat(((campaign.spentBudget || 0) / campaign.totalBudget * 100).toFixed(2))
      : 0;

    return successResponse({
      ...campaign,
      budgetRemaining,
      budgetUtilization,
    });
  } catch (error: any) {
    console.error('Error fetching budget:', error);
    return errorResponse('Failed to fetch budget');
  }
});
