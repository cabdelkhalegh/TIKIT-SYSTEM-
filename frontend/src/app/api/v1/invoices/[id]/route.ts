export const dynamic = 'force-dynamic';

// Invoices CRUD - Get, Update, Delete by ID
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/invoices/[id]
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        campaign: true,
      },
    });

    if (!invoice) {
      return errorResponse('Invoice not found', 404);
    }

    return successResponse(invoice);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return errorResponse('Failed to fetch invoice');
  }
});

// PUT /api/v1/invoices/[id]
export const PUT = withRole(['admin', 'client_manager'], async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
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

    return successResponse(invoice, 'Invoice updated successfully');
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    if (error.code === 'P2025') {
      return errorResponse('Invoice not found', 404);
    }
    return errorResponse('Failed to update invoice');
  }
});

// DELETE /api/v1/invoices/[id]
export const DELETE = withRole(['admin'], async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'Invoice deleted successfully');
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    if (error.code === 'P2025') {
      return errorResponse('Invoice not found', 404);
    }
    return errorResponse('Failed to delete invoice');
  }
});
