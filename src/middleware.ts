import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/authUtils';

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const tokenCookie = request.cookies.get(ADMIN_AUTH_COOKIE_NAME);

    if (!tokenCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await verifySessionToken(tokenCookie.value);
      if (!payload) {
        // Invalid token, clear it and redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(ADMIN_AUTH_COOKIE_NAME);
        return response;
      }
      // Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware token verification error:', error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(ADMIN_AUTH_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // Protect all routes under /admin
};
