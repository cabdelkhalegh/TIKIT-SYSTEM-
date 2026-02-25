export const dynamic = 'force-dynamic';

// T025: Campaign risk assessment proxy route
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';

function calculateRisk(campaign: any) {
  let score = 0;
  const factors: Array<{ field: string; missing: boolean; points: number }> = [];

  if (!campaign.totalBudget && campaign.totalBudget !== 0) {
    score += 3;
    factors.push({ field: 'budget', missing: true, points: 3 });
  }
  if (!campaign.startDate) {
    score += 2;
    factors.push({ field: 'startDate', missing: true, points: 2 });
  }
  if (!campaign.endDate) {
    score += 2;
    factors.push({ field: 'endDate', missing: true, points: 2 });
  }
  if (!campaign.clientId) {
    score += 2;
    factors.push({ field: 'clientId', missing: true, points: 2 });
  }

  let incomplete = 0;
  if (!campaign.campaignName || campaign.campaignName.trim() === '') {
    incomplete += 1;
    factors.push({ field: 'name', missing: true, points: 1 });
  }
  if (!campaign.campaignDescription) {
    incomplete += 1;
    factors.push({ field: 'description', missing: true, points: 1 });
  }
  if (!campaign.campaignObjectives) {
    incomplete += 1;
    factors.push({ field: 'objectives', missing: true, points: 1 });
  }
  score += Math.min(incomplete, 3);

  const level = score < 2 ? 'low' : score <= 4 ? 'medium' : 'high';
  return { score, level, factors };
}

export const GET = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    const risk = calculateRisk(campaign);

    return successResponse({
      campaignId: campaign.campaignId,
      riskScore: risk.score,
      riskLevel: risk.level,
      factors: risk.factors,
      requiresDirectorOverride: risk.score >= 5,
      campaign: {
        id: campaign.campaignId,
        displayId: campaign.displayId,
        campaignName: campaign.campaignName,
      },
    });
  } catch (error: any) {
    console.error('Error fetching campaign risk:', error);
    return errorResponse('Failed to fetch campaign risk assessment');
  }
});
