export const dynamic = 'force-dynamic';

// Health check endpoint
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'TIKIT Backend API',
    timestamp: new Date().toISOString(),
    version: '0.5.0',
  });
}
