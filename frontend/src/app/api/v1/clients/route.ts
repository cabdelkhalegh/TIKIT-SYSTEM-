export const dynamic = 'force-dynamic';

// Clients CRUD - List and Create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/clients - List all clients
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        campaigns: {
          select: {
            campaignId: true,
            campaignName: true,
            status: true,
          },
        },
      },
      orderBy: {
        accountCreatedAt: 'desc',
      },
    });

    return successResponse(clients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return errorResponse('Failed to fetch clients');
  }
});

// POST /api/v1/clients - Create new client
export const POST = withRole(['admin', 'client_manager'], async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();

    const client = await prisma.client.create({
      data: body,
      include: {
        campaigns: true,
      },
    });

    return successResponse(client, 'Client created successfully', 201);
  } catch (error: any) {
    console.error('Error creating client:', error);
    return errorResponse('Failed to create client');
  }
});
