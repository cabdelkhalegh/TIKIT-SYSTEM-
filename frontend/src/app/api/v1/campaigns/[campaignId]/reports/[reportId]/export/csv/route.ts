export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// GET /api/v1/campaigns/:campaignId/reports/:reportId/export/csv
export async function GET(req: NextRequest, { params }: { params: { campaignId: string; reportId: string } }) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/campaigns/${params.campaignId}/reports/${params.reportId}/export/csv`,
      { method: 'GET', headers: getHeaders(req) }
    );
    const csv = await response.text();
    return new NextResponse(csv, {
      status: response.status,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment; filename="report.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to export CSV' }, { status: 500 });
  }
}
