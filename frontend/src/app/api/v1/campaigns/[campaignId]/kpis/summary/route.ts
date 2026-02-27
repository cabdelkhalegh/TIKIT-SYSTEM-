export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// GET /api/v1/campaigns/:campaignId/kpis/summary — aggregated KPI summary
export async function GET(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const url = `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/kpis/summary`;

    const response = await fetch(url, { method: 'GET', headers: getHeaders(req) });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying GET KPI summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPI summary' },
      { status: 500 }
    );
  }
}
