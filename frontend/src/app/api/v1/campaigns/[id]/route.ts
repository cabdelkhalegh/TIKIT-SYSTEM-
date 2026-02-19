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
