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

    return successResponse(campaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return errorResponse('Failed to fetch campaigns');
  }
});

// POST /api/v1/campaigns - Create new campaign
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    const campaign = await prisma.campaign.create({
      data: {
        ...body,
        status: body.status || 'draft',
      },
      include: {
        client: true,
      },
    });

    return successResponse(campaign, 'Campaign created successfully', 201);
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return errorResponse('Failed to create campaign');
  }
});
