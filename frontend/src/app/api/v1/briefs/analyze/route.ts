export const dynamic = 'force-dynamic';

// Brief AI analysis — standalone (no DB save), proxy to backend
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/v1/briefs/analyze
// Accepts JSON { text } or multipart file upload
export async function POST(req: NextRequest) {
  try {
    const url = `${BACKEND_URL}/api/v1/briefs/analyze`;
    const contentType = req.headers.get('Content-Type') || '';

    const headers: Record<string, string> = {};
    const authorization = req.headers.get('Authorization');
    if (authorization) {
      headers['Authorization'] = authorization;
    }

    let body: any;

    if (contentType.includes('multipart/form-data')) {
      // Forward multipart form data as-is
      body = await req.formData();
    } else {
      // Forward JSON body
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(await req.json());
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying brief analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze brief' },
      { status: 500 }
    );
  }
}
