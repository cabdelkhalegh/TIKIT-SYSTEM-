export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

function getJsonHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

export async function GET(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/influencer-portal/campaigns/${params.campaignId}/content`,
      { method: 'GET', headers: getJsonHeaders(req) }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying GET influencer content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    // Forward multipart form data as-is
    const formData = await req.formData();
    const backendFormData = new FormData();

    for (const [key, value] of formData.entries()) {
      if (value instanceof Blob) {
        backendFormData.append(key, value, (value as File).name);
      } else {
        backendFormData.append(key, value);
      }
    }

    const headers: Record<string, string> = {};
    const authorization = req.headers.get('Authorization');
    if (authorization) headers['Authorization'] = authorization;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/influencer-portal/campaigns/${params.campaignId}/content`,
      { method: 'POST', headers, body: backendFormData }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying POST influencer content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit content' },
      { status: 500 }
    );
  }
}
