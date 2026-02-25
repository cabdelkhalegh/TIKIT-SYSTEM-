export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// GET /api/v1/campaigns/:campaignId/briefs/:briefId/versions — proxy to Express
export async function GET(req: NextRequest, { params }: { params: { campaignId: string; briefId: string } }) {
  try {
    const headers: Record<string, string> = {};
    const authorization = req.headers.get('Authorization');
    if (authorization) headers['Authorization'] = authorization;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/briefs/${params.briefId}/versions`,
      { method: 'GET', headers }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying GET briefs/versions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch brief versions' }, { status: 500 });
  }
}
