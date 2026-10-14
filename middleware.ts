import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-token';

const PENDING_PATH = '/verify-email/pending';

function isAllowedWhileUnverified(pathname: string, userId: string) {
  if (pathname === PENDING_PATH) return true;
  if (pathname === '/verify-email') return true;
  if (pathname === `/users/${userId}/profile`) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(token);
  if (!session || session.emailVerified) {
    return NextResponse.next();
  }

  if (isAllowedWhileUnverified(pathname, session.userId)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = PENDING_PATH;
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
