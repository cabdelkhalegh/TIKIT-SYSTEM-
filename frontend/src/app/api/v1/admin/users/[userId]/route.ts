export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authorization = req.headers.get('Authorization');
  if (authorization) headers['Authorization'] = authorization;
  return headers;
}

// DELETE /api/v1/admin/users/:userId — soft-delete user
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/admin/users/${params.userId}`,
      { method: 'DELETE', headers: getHeaders(req) }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error proxying DELETE /admin/users/:userId:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
