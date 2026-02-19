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
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      orderBy: {
        accountCreatedAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    const transformedClients = clients.map(client => ({
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
    }));

    return successResponse(transformedClients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return errorResponse('Failed to fetch clients');
  }
});

// POST /api/v1/clients - Create new client
export const POST = withRole(['admin', 'client_manager'], async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();

    // Transform incoming data to match schema
    const clientData: any = {
      brandDisplayName: body.brandName || body.brandDisplayName,
      legalCompanyName: body.companyLegalName || body.legalCompanyName,
      industryVertical: body.industry || body.industryVertical || null,
      primaryContactEmails: JSON.stringify(
        Array.isArray(body.primaryContactEmails) 
          ? body.primaryContactEmails 
          : [body.contactEmail || body.primaryContactEmails]
      ),
      billingContactEmails: JSON.stringify(
        Array.isArray(body.billingContactEmails) 
          ? body.billingContactEmails 
          : []
      ),
      preferredCommChannels: JSON.stringify(
        Array.isArray(body.preferredCommChannels) 
          ? body.preferredCommChannels 
          : ['email']
      ),
    };

    const client = await prisma.client.create({
      data: clientData,
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

    return successResponse(transformedClient, 'Client created successfully', 201);
  } catch (error: any) {
    console.error('Error creating client:', error);
    return errorResponse(error.message || 'Failed to create client', 500);
  }
});
