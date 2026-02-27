export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// PATCH /api/v1/campaigns/:campaignId/invoices/:id/status — update invoice status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { campaignId: string; id: string } }
) {
  try {
    const body = await req.json();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authorization = req.headers.get('Authorization');
    if (authorization) headers['Authorization'] = authorization;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/invoices/${params.id}/status`,
      { method: 'PATCH', headers, body: JSON.stringify(body) }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying PATCH invoice status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice status' },
      { status: 500 }
    );
  }
}
