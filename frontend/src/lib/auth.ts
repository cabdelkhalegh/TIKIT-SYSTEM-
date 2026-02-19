// Authentication helpers for Next.js API routes
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'tikit-v2-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  uid: string;
  emailAddress: string;
  userRole: string;
  timestamp: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create JWT token
export function createToken(user: { userId: string; email: string; role: string }): string {
  const payload: TokenPayload = {
    uid: user.userId,
    emailAddress: user.email,
    userRole: user.role,
    timestamp: Date.now(),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify and decode JWT token
export function verifyToken(token: string): { valid: boolean; payload: TokenPayload | null; error?: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return { valid: true, payload: decoded };
  } catch (error: any) {
    return { valid: false, payload: null, error: error.message };
  }
}

// Extract auth user from request
export function getAuthUser(req: NextRequest): AuthUser | null {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const verification = verifyToken(token);

  if (!verification.valid || !verification.payload) {
    return null;
  }

  return {
    userId: verification.payload.uid,
    email: verification.payload.emailAddress,
    role: verification.payload.userRole,
  };
}

// Middleware helper to require authentication
export function requireAuth(req: NextRequest): { user: AuthUser } | { error: string; status: number } {
  const user = getAuthUser(req);

  if (!user) {
    return {
      error: 'Authentication token missing or invalid',
      status: 401,
    };
  }

  return { user };
}

// Middleware helper to require specific roles
export function requireRole(req: NextRequest, allowedRoles: string[]): { user: AuthUser } | { error: string; status: number } {
  const authResult = requireAuth(req);

  if ('error' in authResult) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      error: 'Insufficient permissions',
      status: 403,
    };
  }

  return authResult;
}
