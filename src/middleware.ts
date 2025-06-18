
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/authUtils';

const ADMIN_AUTH_COOKIE_NAME = 'admin-auth-token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan akses ke halaman login
  if (pathname === '/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const tokenCookie = request.cookies.get(ADMIN_AUTH_COOKIE_NAME);

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await verifySessionToken(tokenCookie.value);
      if (!payload) {
        // Token tidak valid, hapus cookie dan redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(ADMIN_AUTH_COOKIE_NAME);
        return response;
      }
      // Token valid, izinkan akses
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
  matcher: ['/admin/:path*', '/login'], // Lindungi semua rute di bawah /admin, proses juga /login
};
