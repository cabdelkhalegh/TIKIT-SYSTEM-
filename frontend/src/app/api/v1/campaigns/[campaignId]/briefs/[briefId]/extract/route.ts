export const dynamic = 'force-dynamic';

// Brief AI extraction — proxy to backend (needs Gemini API key)
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/v1/campaigns/:campaignId/briefs/:briefId/extract
export async function POST(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const campaignId = pathname.split('/campaigns/')[1].split('/briefs')[0];
    const briefId = pathname.split('/briefs/')[1].split('/extract')[0];

    const url = `${BACKEND_URL}/api/v1/campaigns/${campaignId}/briefs/${briefId}/extract`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying brief extraction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract brief' },
      { status: 500 }
    );
  }
}
