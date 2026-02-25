export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/v1/campaigns/:campaignId/briefs/:briefId/review — proxy to Express
export async function POST(req: NextRequest, { params }: { params: { campaignId: string; briefId: string } }) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authorization = req.headers.get('Authorization');
    if (authorization) headers['Authorization'] = authorization;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/briefs/${params.briefId}/review`,
      { method: 'POST', headers, body: JSON.stringify({}) }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying POST briefs/review:', error);
    return NextResponse.json({ success: false, error: 'Failed to mark brief as reviewed' }, { status: 500 });
  }
}
