export const dynamic = 'force-dynamic';

// Collaborations CRUD - List and Create
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/collaborations
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const influencerId = searchParams.get('influencerId');
    const status = searchParams.get('status');

    const where: any = {};
    if (campaignId) where.campaignId = campaignId;
    if (influencerId) where.influencerId = influencerId;
    if (status) where.collaborationStatus = status;

    const collaborations = await prisma.campaignInfluencer.findMany({
      where,
      include: {
        campaign: {
          select: {
            campaignId: true,
            campaignName: true,
            status: true,
            client: {
              select: {
                brandDisplayName: true,
              },
            },
          },
        },
        influencer: {
          select: {
            influencerId: true,
            displayName: true,
            fullName: true,
            primaryPlatform: true,
          },
        },
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    const transformedCollaborations = collaborations.map(collab => ({
      id: collab.id,
      campaignId: collab.campaignId,
      influencerId: collab.influencerId,
      campaign: collab.campaign,
      influencer: collab.influencer ? {
        ...collab.influencer,
        profileName: collab.influencer.displayName,
      } : null,
      role: collab.role,
      status: collab.collaborationStatus,
      collaborationStatus: collab.collaborationStatus,
      agreedDeliverables: collab.agreedDeliverables 
        ? JSON.parse(collab.agreedDeliverables) 
        : [],
      deliveredContent: collab.deliveredContent 
        ? JSON.parse(collab.deliveredContent) 
        : [],
      agreedPayment: collab.agreedPayment,
      agreedAmount: collab.agreedPayment, // Alias for frontend
      paymentStatus: collab.paymentStatus,
      performanceMetrics: collab.performanceMetrics 
        ? JSON.parse(collab.performanceMetrics) 
        : null,
      invitedAt: collab.invitedAt,
      acceptedAt: collab.acceptedAt,
      completedAt: collab.completedAt,
    }));

    return successResponse(transformedCollaborations);
  } catch (error: any) {
    console.error('Error fetching collaborations:', error);
    return errorResponse('Failed to fetch collaborations');
  }
});

// POST /api/v1/collaborations
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    const collaboration = await prisma.campaignInfluencer.create({
      data: {
        ...body,
        collaborationStatus: body.collaborationStatus || 'invited',
        invitedAt: new Date(),
      },
      include: {
        campaign: true,
        influencer: true,
      },
    });

    return successResponse(collaboration, 'Collaboration created successfully', 201);
  } catch (error: any) {
    console.error('Error creating collaboration:', error);
    return errorResponse('Failed to create collaboration');
  }
});
