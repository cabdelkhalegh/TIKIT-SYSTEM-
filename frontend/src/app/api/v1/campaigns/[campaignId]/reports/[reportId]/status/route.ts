export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// PATCH /api/v1/campaigns/:campaignId/reports/:reportId/status
export async function PATCH(req: NextRequest, { params }: { params: { campaignId: string; reportId: string } }) {
  try {
    const body = await req.json();
    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/reports/${params.reportId}/status`,
      { method: 'PATCH', headers: getHeaders(req), body: JSON.stringify(body) }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update report status' }, { status: 500 });
  }
}
