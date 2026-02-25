export const dynamic = 'force-dynamic';

// Campaigns CRUD - Get, Update, Delete, Patch by ID
import { NextRequest, NextResponse } from 'next/server';
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

    // Transform JSON strings back to objects/arrays for frontend
    const transformedCampaign = {
      ...campaign,
      campaignObjectives: campaign.campaignObjectives 
        ? JSON.parse(campaign.campaignObjectives) 
        : [],
      targetAudience: campaign.targetAudienceJson 
        ? JSON.parse(campaign.targetAudienceJson) 
        : null,
      targetPlatforms: campaign.targetPlatformsJson 
        ? JSON.parse(campaign.targetPlatformsJson) 
        : [],
      performanceKPIs: campaign.performanceKPIsJson 
        ? JSON.parse(campaign.performanceKPIsJson) 
        : {},
      // Transform client data
      client: campaign.client ? {
        ...campaign.client,
        id: campaign.client.clientId,
        brandName: campaign.client.brandDisplayName,
        companyLegalName: campaign.client.legalCompanyName,
        industry: campaign.client.industryVertical,
      } : null,
    };

    return successResponse(transformedCampaign);
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

    // Transform form data to match database schema (same as POST)
    const updateData: any = {};
    
    if (body.campaignName !== undefined) updateData.campaignName = body.campaignName;
    if (body.campaignDescription !== undefined) updateData.campaignDescription = body.campaignDescription;
    if (body.clientId !== undefined) updateData.clientId = body.clientId;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.totalBudget !== undefined) updateData.totalBudget = body.totalBudget;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

    // Convert arrays/objects to JSON strings
    if (body.campaignObjectives !== undefined) {
      updateData.campaignObjectives = JSON.stringify(body.campaignObjectives);
    }
    if (body.targetAudience !== undefined) {
      updateData.targetAudienceJson = JSON.stringify(body.targetAudience);
    }
    if (body.targetPlatforms !== undefined) {
      updateData.targetPlatformsJson = JSON.stringify(body.targetPlatforms);
    }
    if (body.performanceKPIs !== undefined) {
      updateData.performanceKPIsJson = JSON.stringify(body.performanceKPIs);
    }

    const campaign = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: updateData,
      include: {
        client: true,
      },
    });

    // Transform response back
    const transformedCampaign = {
      ...campaign,
      campaignObjectives: campaign.campaignObjectives 
        ? JSON.parse(campaign.campaignObjectives) 
        : [],
      targetAudience: campaign.targetAudienceJson 
        ? JSON.parse(campaign.targetAudienceJson) 
        : null,
      targetPlatforms: campaign.targetPlatformsJson 
        ? JSON.parse(campaign.targetPlatformsJson) 
        : [],
      performanceKPIs: campaign.performanceKPIsJson 
        ? JSON.parse(campaign.performanceKPIsJson) 
        : {},
    };

    return successResponse(transformedCampaign, 'Campaign updated successfully');
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    if (error.code === 'P2025') {
      return errorResponse('Campaign not found', 404);
    }
    return errorResponse('Failed to update campaign');
  }
});

// DELETE /api/v1/campaigns/[id] — T023: Soft-delete (draft only)
export const DELETE = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    if (campaign.status !== 'draft') {
      return errorResponse('Only draft campaigns can be deleted', 400);
    }

    await prisma.campaign.update({
      where: { campaignId: params.id },
      data: { isDeleted: true },
    });

    return successResponse({ message: 'Campaign soft-deleted', id: campaign.campaignId });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return errorResponse('Failed to delete campaign');
  }
});

// PATCH /api/v1/campaigns/[id] — T022: Optimistic concurrency update
export const PATCH = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const body = await req.json();
    const { version, name, description, clientId, budget, managementFee, startDate, endDate } = body;

    if (version === undefined || version === null) {
      return errorResponse('version is required for optimistic concurrency', 400);
    }

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    if (campaign.status === 'closed') {
      return errorResponse('Cannot modify a closed campaign', 400);
    }

    if (campaign.version !== version) {
      return NextResponse.json({
        success: false,
        error: `Conflict: campaign has been modified. Your version: ${version}, current version: ${campaign.version}. Please refresh and retry.`,
        data: { currentVersion: campaign.version },
      }, { status: 409 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.campaignName = name;
    if (description !== undefined) updateData.campaignDescription = description;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (budget !== undefined) updateData.totalBudget = budget;
    if (managementFee !== undefined) updateData.managementFee = managementFee;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Budget revision tracking
    if (budget !== undefined && budget !== campaign.totalBudget) {
      await prisma.budgetRevision.create({
        data: {
          campaignId: campaign.campaignId,
          previousBudget: campaign.totalBudget || 0,
          newBudget: budget,
          changedBy: 'user',
        },
      });
    }

    // Recalculate risk score
    const merged = { ...campaign, ...updateData };
    let riskScore = 0;
    if (!merged.totalBudget && merged.totalBudget !== 0) riskScore += 3;
    if (!merged.startDate) riskScore += 2;
    if (!merged.endDate) riskScore += 2;
    if (!merged.clientId) riskScore += 2;
    let inc = 0;
    if (!merged.campaignName || merged.campaignName.trim() === '') inc += 1;
    if (!merged.campaignDescription) inc += 1;
    if (!merged.campaignObjectives) inc += 1;
    riskScore += Math.min(inc, 3);

    updateData.riskScore = riskScore;
    updateData.riskLevel = riskScore < 2 ? 'low' : riskScore <= 4 ? 'medium' : 'high';
    updateData.version = campaign.version + 1;

    const updated = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: updateData,
      include: { client: true },
    });

    return successResponse(updated, 'Campaign updated successfully');
  } catch (error: any) {
    console.error('Error patching campaign:', error);
    return errorResponse('Failed to update campaign');
  }
});
