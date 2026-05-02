import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    // Redirect unauthenticated users to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // Basic JWT expiry check (no signature verification — that's the API gateway's job)
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'),
    );
    const expiry = payload.exp as number;
    if (expiry && Date.now() / 1000 > expiry) {
      // Token expired — clear cookie and redirect to login
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete('access_token');
      res.cookies.delete('refresh_token');
      return res;
    }
  } catch {
    // Malformed token — send to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
