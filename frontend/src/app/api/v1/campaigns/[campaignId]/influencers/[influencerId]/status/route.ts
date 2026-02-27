export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// PATCH /api/v1/campaigns/:campaignId/influencers/:influencerId/status — proxy
export async function PATCH(
  req: NextRequest,
  { params }: { params: { campaignId: string; influencerId: string } }
) {
  try {
    const body = await req.json();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authorization = req.headers.get('Authorization');
    if (authorization) headers['Authorization'] = authorization;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/influencers/${params.influencerId}/status`,
      { method: 'PATCH', headers, body: JSON.stringify(body) }
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying PATCH influencer status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transition influencer status' },
      { status: 500 }
    );
  }
}
