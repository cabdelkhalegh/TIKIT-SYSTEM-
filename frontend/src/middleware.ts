import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const rawCookie = request.cookies.get('tikit-auth-storage')?.value;
  const token = rawCookie ? decodeURIComponent(rawCookie) : undefined;
  
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Try to parse the token to verify it's valid
    try {
      const authData = JSON.parse(token);
      if (!authData.state?.token || !authData.state?.isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If already logged in and trying to access login/register, redirect to dashboard
  if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    try {
      const authData = JSON.parse(token);
      if (authData.state?.token && authData.state?.isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // Invalid token, allow access to login/register
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
