export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// GET /api/v1/campaigns/:campaignId/influencers — list campaign influencers
export async function GET(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const url = new URL(req.url);
    const queryString = url.search;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/influencers${queryString}`,
      { method: 'GET', headers: getHeaders(req) }
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying GET /campaigns/:campaignId/influencers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list campaign influencers' },
      { status: 500 }
    );
  }
}

// POST /api/v1/campaigns/:campaignId/influencers — add influencer to campaign
export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const body = await req.json();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/influencers`,
      { method: 'POST', headers: getHeaders(req), body: JSON.stringify(body) }
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying POST /campaigns/:campaignId/influencers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add influencer to campaign' },
      { status: 500 }
    );
  }
}
