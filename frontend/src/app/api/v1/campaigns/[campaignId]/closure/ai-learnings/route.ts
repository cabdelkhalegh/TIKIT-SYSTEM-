export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/closure/ai-learnings`,
      { method: 'POST', headers: getHeaders(req), body: '{}' }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to generate AI learnings' }, { status: 500 });
  }
}
