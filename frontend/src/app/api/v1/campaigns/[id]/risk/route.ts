export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// GET /api/v1/campaigns/:id/risk — proxy to Express backend
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/campaigns/${params.id}/risk`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying GET /campaigns/:id/risk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch risk assessment' },
      { status: 500 }
    );
  }
}
