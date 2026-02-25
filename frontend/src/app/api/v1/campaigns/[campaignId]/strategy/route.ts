export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// GET /api/v1/campaigns/:campaignId/strategy — proxy to Express backend
export async function GET(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/strategy`, {
      method: 'GET',
      headers: getHeaders(req),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying GET strategy:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch strategy' }, { status: 500 });
  }
}

// PUT /api/v1/campaigns/:campaignId/strategy — proxy to Express backend
export async function PUT(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const body = await req.json();
    const response = await fetch(`${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/strategy`, {
      method: 'PUT',
      headers: getHeaders(req),
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying PUT strategy:', error);
    return NextResponse.json({ success: false, error: 'Failed to update strategy' }, { status: 500 });
  }
}
