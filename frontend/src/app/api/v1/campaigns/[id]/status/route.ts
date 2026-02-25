export const dynamic = 'force-dynamic';

// T024: Campaign status transition proxy route
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { canTransitionStatus } from '@/lib/campaign-helpers';

const STATUS_TO_PHASE: Record<string, string> = {
  draft: 'brief_intake',
  in_review: 'budget_review',
  pitching: 'client_pitching',
  live: 'content_production',
  reporting: 'report_generation',
  closed: 'closure',
};

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const body = await req.json();
    const { targetStatus, newStatus, overrideReason } = body;
    const target = targetStatus || newStatus;

    if (!target) {
      return errorResponse('targetStatus is required', 400);
    }

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    // Validate transition using V2 status machine
    if (!canTransitionStatus(campaign.status, target)) {
      return errorResponse(
        `Invalid status transition from ${campaign.status} to ${target}`,
        400
      );
    }

    // Gate checks for specific transitions
    const unmet: string[] = [];

    if (campaign.status === 'draft' && target === 'in_review') {
      const briefs = await prisma.brief.findMany({
        where: { campaignId: params.id },
      });
      if (briefs.length === 0) unmet.push('At least one brief must be created');
      if (!briefs.some((b: any) => b.isReviewed)) unmet.push('Brief must be marked as reviewed');
    }

    if (campaign.status === 'in_review' && target === 'pitching') {
      const approval = await prisma.approval.findFirst({
        where: { campaignId: params.id, type: 'budget', status: 'approved' },
      });
      if (!approval) unmet.push('Director budget approval required');
    }

    if (campaign.status === 'pitching' && target === 'live') {
      const approval = await prisma.approval.findFirst({
        where: { campaignId: params.id, type: 'shortlist', status: 'approved' },
      });
      if (!approval) unmet.push('Client shortlist approval required');
    }

    if (campaign.status === 'live' && target === 'reporting') {
      const influencers = await prisma.campaignInfluencer.findMany({
        where: { campaignId: params.id },
        include: { content: true },
      });
      if (influencers.length === 0) unmet.push('Campaign must have at least one influencer');
      for (const ci of influencers) {
        if (!ci.content.some((c: any) => c.livePostUrl)) {
          unmet.push(`Influencer ${ci.influencerId} missing live post URL`);
        }
      }
    }

    if (campaign.status === 'reporting' && target === 'closed') {
      const report = await prisma.report.findFirst({
        where: { campaignId: params.id, status: 'approved' },
      });
      if (!report) unmet.push('Report must be client-approved');
      const unpaid = await prisma.invoice.findMany({
        where: { campaignId: params.id, status: { not: 'paid' } },
      });
      if (unpaid.length > 0) unmet.push(`${unpaid.length} invoice(s) not yet paid`);
    }

    if (unmet.length > 0) {
      return errorResponse(
        `Gate validation failed`,
        400
      );
    }

    const previousStatus = campaign.status;
    const newPhase = STATUS_TO_PHASE[target] || campaign.phase;

    const updateData: any = {
      status: target,
      phase: newPhase,
      version: { increment: 1 },
    };

    if (target === 'closed') {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: updateData,
      include: { client: true },
    });

    // Record high-risk override approval
    if (overrideReason && campaign.riskScore >= 5) {
      await prisma.approval.create({
        data: {
          campaignId: params.id,
          type: 'high_risk_override',
          status: 'approved',
          reason: overrideReason,
        },
      });
    }

    return successResponse({
      id: updated.campaignId,
      previousStatus,
      newStatus: target,
      phase: updated.phase,
      version: updated.version,
      updatedAt: updated.updatedAt,
    });
  } catch (error: any) {
    console.error('Error transitioning campaign status:', error);
    return errorResponse('Failed to transition campaign status');
  }
});
