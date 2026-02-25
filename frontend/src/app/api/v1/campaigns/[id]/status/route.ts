export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/v1/campaigns/:id/status — proxy to Express backend
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/campaigns/${params.id}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying POST /campaigns/:id/status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transition status' },
      { status: 500 }
    );
  }
}
