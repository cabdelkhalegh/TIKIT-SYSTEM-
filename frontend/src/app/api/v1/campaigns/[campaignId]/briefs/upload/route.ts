export const dynamic = 'force-dynamic';

// Brief file upload — forward multipart to backend
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/v1/campaigns/:campaignId/briefs/upload
export async function POST(req: NextRequest) {
  try {
    const campaignId = req.nextUrl.pathname.split('/campaigns/')[1].split('/briefs')[0];
    const url = `${BACKEND_URL}/api/v1/campaigns/${campaignId}/briefs/upload`;

    const formData = await req.formData();

    const headers: Record<string, string> = {};
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying brief upload:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload brief' },
      { status: 500 }
    );
  }
}
