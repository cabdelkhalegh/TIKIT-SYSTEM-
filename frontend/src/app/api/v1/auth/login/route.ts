export const dynamic = 'force-dynamic';

// User login endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication credentials are invalid',
        },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'User account has been deactivated',
        },
        { status: 403 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication credentials are invalid',
        },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date() },
    });

    // Remove sensitive fields
    const { passwordHash, passwordResetToken, passwordResetExpires, emailVerificationToken, ...safeUserData } = user;

    // Create auth token
    const authToken = createToken(user);

    return NextResponse.json({
      success: true,
      message: 'User authenticated successfully',
      data: {
        userAccount: safeUserData,
        authToken,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication process encountered an error',
      },
      { status: 500 }
    );
  }
}
