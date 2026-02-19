export const dynamic = 'force-dynamic';

// Campaigns CRUD - List and Create
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/campaigns - List campaigns with filters
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        client: {
          select: {
            clientId: true,
            brandDisplayName: true,
            legalCompanyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform JSON strings back to objects/arrays for frontend
    const transformedCampaigns = campaigns.map(campaign => ({
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
    }));

    return successResponse(transformedCampaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return errorResponse('Failed to fetch campaigns');
  }
});

// POST /api/v1/campaigns - Create new campaign
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Transform form data to match database schema
    const campaignData: any = {
      campaignName: body.campaignName,
      campaignDescription: body.campaignDescription || null,
      clientId: body.clientId,
      status: body.status || 'draft',
      totalBudget: body.totalBudget || null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    };

    // Convert arrays/objects to JSON strings as per schema
    if (body.campaignObjectives) {
      campaignData.campaignObjectives = JSON.stringify(body.campaignObjectives);
    }
    if (body.targetAudience) {
      campaignData.targetAudienceJson = JSON.stringify(body.targetAudience);
    }
    if (body.targetPlatforms) {
      campaignData.targetPlatformsJson = JSON.stringify(body.targetPlatforms);
    }
    if (body.performanceKPIs) {
      campaignData.performanceKPIsJson = JSON.stringify(body.performanceKPIs);
    }

    const campaign = await prisma.campaign.create({
      data: campaignData,
      include: {
        client: true,
      },
    });

    return successResponse(campaign, 'Campaign created successfully', 201);
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return errorResponse(error.message || 'Failed to create campaign', 500);
  }
});
