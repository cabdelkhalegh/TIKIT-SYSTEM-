export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// GET /api/v1/campaigns/:campaignId/kpis — list KPIs
export async function GET(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const qs = searchParams.toString();
    const url = `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/kpis${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, { method: 'GET', headers: getHeaders(req) });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying GET KPIs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

// POST /api/v1/campaigns/:campaignId/kpis — manual KPI entry
export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const body = await req.json();
    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/kpis`,
      { method: 'POST', headers: getHeaders(req), body: JSON.stringify(body) }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying POST KPI entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create KPI entry' },
      { status: 500 }
    );
  }
}
