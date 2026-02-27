export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// POST /api/v1/campaigns/:campaignId/kpis/auto-capture — trigger auto-capture
export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const body = await req.json();
    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/kpis/auto-capture`,
      { method: 'POST', headers: getHeaders(req), body: JSON.stringify(body) }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying POST auto-capture:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger auto-capture' },
      { status: 500 }
    );
  }
}
