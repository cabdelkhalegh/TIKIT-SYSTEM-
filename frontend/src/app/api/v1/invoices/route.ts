export const dynamic = 'force-dynamic';

// Invoices CRUD - List and Create
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/invoices?campaignId=:id - List invoices for a campaign
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    const where: any = {};
    if (campaignId) {
      where.campaignId = campaignId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        campaign: {
          select: {
            campaignId: true,
            campaignName: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return errorResponse('Failed to fetch invoices');
  }
});

// POST /api/v1/invoices - Create new invoice
export const POST = withRole(['admin', 'client_manager'], async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber || null,
        type: body.type,
        status: body.status || 'draft',
        amount: parseFloat(body.amount),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        fileUrl: body.fileUrl || null,
        notes: body.notes || null,
        campaignId: body.campaignId,
      },
      include: {
        campaign: {
          select: {
            campaignId: true,
            campaignName: true,
            status: true,
          },
        },
      },
    });

    return successResponse(invoice, 'Invoice created successfully', 201);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return errorResponse(error.message || 'Failed to create invoice', 500);
  }
});
