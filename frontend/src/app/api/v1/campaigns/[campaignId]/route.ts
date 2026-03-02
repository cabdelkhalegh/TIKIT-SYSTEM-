export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function proxyRequest(req: NextRequest, campaignId: string, method: string, body?: unknown) {
  const token = req.headers.get('authorization');
  const res = await fetch(`${API_URL}/api/v1/campaigns/${campaignId}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    return await proxyRequest(req, params.campaignId, 'GET');
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const body = await req.json();
    return await proxyRequest(req, params.campaignId, 'PATCH', body);
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const body = await req.json();
    return await proxyRequest(req, params.campaignId, 'PUT', body);
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    return await proxyRequest(req, params.campaignId, 'DELETE');
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete campaign' }, { status: 500 });
  }
}
