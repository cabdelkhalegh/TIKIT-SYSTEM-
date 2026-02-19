export const dynamic = 'force-dynamic';

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
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!client) {
      return errorResponse('Client not found', 404);
    }

    // Transform to match frontend expectations
    const transformedClient = {
      id: client.clientId,
      clientId: client.clientId,
      brandName: client.brandDisplayName,
      companyLegalName: client.legalCompanyName,
      industry: client.industryVertical,
      contactEmail: client.primaryContactEmails ? JSON.parse(client.primaryContactEmails)[0] : null,
      primaryContactEmails: client.primaryContactEmails ? JSON.parse(client.primaryContactEmails) : [],
      billingContactEmails: client.billingContactEmails ? JSON.parse(client.billingContactEmails) : [],
      preferredCommChannels: client.preferredCommChannels ? JSON.parse(client.preferredCommChannels) : [],
      spendTotals: client.totalAdSpend || 0,
      createdAt: client.accountCreatedAt,
      updatedAt: client.lastModifiedAt,
      campaigns: client.campaigns,
      _count: client._count,
    };

    return successResponse(transformedClient);
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return errorResponse('Failed to fetch client');
  }
});

// PUT /api/v1/clients/[id]
export const PUT = withRole(['admin', 'client_manager'], async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();

    // Transform incoming data to match schema
    const updateData: any = {};
    
    if (body.brandName !== undefined) updateData.brandDisplayName = body.brandName;
    if (body.companyLegalName !== undefined) updateData.legalCompanyName = body.companyLegalName;
    if (body.industry !== undefined) updateData.industryVertical = body.industry;
    if (body.primaryContactEmails !== undefined) {
      updateData.primaryContactEmails = JSON.stringify(body.primaryContactEmails);
    }
    if (body.billingContactEmails !== undefined) {
      updateData.billingContactEmails = JSON.stringify(body.billingContactEmails);
    }
    if (body.preferredCommChannels !== undefined) {
      updateData.preferredCommChannels = JSON.stringify(body.preferredCommChannels);
    }

    const client = await prisma.client.update({
      where: { clientId: params.id },
      data: updateData,
      include: {
        campaigns: true,
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    // Transform response
    const transformedClient = {
      id: client.clientId,
      clientId: client.clientId,
      brandName: client.brandDisplayName,
      companyLegalName: client.legalCompanyName,
      industry: client.industryVertical,
      contactEmail: client.primaryContactEmails ? JSON.parse(client.primaryContactEmails)[0] : null,
      primaryContactEmails: client.primaryContactEmails ? JSON.parse(client.primaryContactEmails) : [],
      billingContactEmails: client.billingContactEmails ? JSON.parse(client.billingContactEmails) : [],
      preferredCommChannels: client.preferredCommChannels ? JSON.parse(client.preferredCommChannels) : [],
      spendTotals: client.totalAdSpend || 0,
      createdAt: client.accountCreatedAt,
      updatedAt: client.lastModifiedAt,
      campaigns: client.campaigns,
      _count: client._count,
    };

    return successResponse(transformedClient, 'Client updated successfully');
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
