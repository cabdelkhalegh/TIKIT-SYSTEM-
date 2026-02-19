// Clients CRUD - Get, Update, Delete by ID
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/clients/[id]
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const client = await prisma.client.findUnique({
      where: { clientId: params.id },
      include: {
        campaigns: true,
      },
    });

    if (!client) {
      return errorResponse('Client not found', 404);
    }

    return successResponse(client);
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return errorResponse('Failed to fetch client');
  }
});

// PUT /api/v1/clients/[id]
export const PUT = withRole(['admin', 'client_manager'], async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();

    const client = await prisma.client.update({
      where: { clientId: params.id },
      data: body,
      include: {
        campaigns: true,
      },
    });

    return successResponse(client, 'Client updated successfully');
  } catch (error: any) {
    console.error('Error updating client:', error);
    if (error.code === 'P2025') {
      return errorResponse('Client not found', 404);
    }
    return errorResponse('Failed to update client');
  }
});

// DELETE /api/v1/clients/[id]
export const DELETE = withRole(['admin'], async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await prisma.client.delete({
      where: { clientId: params.id },
    });

    return successResponse(null, 'Client deleted successfully');
  } catch (error: any) {
    console.error('Error deleting client:', error);
    if (error.code === 'P2025') {
      return errorResponse('Client not found', 404);
    }
    return errorResponse('Failed to delete client');
  }
});
