// Helper utilities for API routes
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from './auth';

export function errorResponse(error: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

export function successResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
    },
    { status }
  );
}

export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const authResult = requireAuth(req);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }
    return handler(req, authResult.user);
  };
}

export function withRole(allowedRoles: string[], handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const authResult = requireRole(req, allowedRoles);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }
    return handler(req, authResult.user);
  };
}
