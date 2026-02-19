export const dynamic = 'force-dynamic';

// User registration endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, displayName, role } = body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, password, and full name are required',
        },
        { status: 400 }
      );
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account with this email address already registered',
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        displayName: displayName || fullName,
        role: role || 'client_manager',
      },
      select: {
        userId: true,
        email: true,
        fullName: true,
        displayName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Create auth token
    const authToken = createToken(newUser);

    return NextResponse.json(
      {
        success: true,
        message: 'New user account created successfully',
        data: {
          userAccount: newUser,
          authToken,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to create user account',
      },
      { status: 500 }
    );
  }
}
