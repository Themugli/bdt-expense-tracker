import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do NOT require authentication
const PUBLIC_PATHS = ['/', '/index.html', '/favicon.ico'];
const ASSET_PREFIXES = ['/assets/', '/_next/', '/static/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── 1. Security headers on EVERY response ──────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'font-src https://fonts.gstatic.com',
      "img-src 'self' data: blob:",
      'connect-src https://etxnrbiuiloynvmaqnss.supabase.co wss://etxnrbiuiloynvmaqnss.supabase.co',
      "frame-ancestors 'none'",
    ].join('; '),
  );

  // ── 2. HTTPS enforcement (redirect plain HTTP) ─────────────────────────
  if (
    request.headers.get('x-forwarded-proto') === 'http' &&
    process.env.NODE_ENV === 'production'
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = 'https';
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // ── 3. Skip middleware for static assets ───────────────────────────────
  const isAsset = ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAsset) return response;

  // ── 4. Session check — protect all non-public pages ───────────────────
  // The Supabase session is stored in a cookie named 'sb-...-auth-token'.
  // If there is no session cookie at all, it's a fresh visit → let SPA handle it.
  // Real auth enforcement happens in Supabase RLS on the database level.
  // The middleware adds a secondary layer: if someone manually crafts a URL like
  // /user/OTHER_USER_ID/data we strip the rogue user_id from the URL so the SPA
  // always boots at "/" and the client-side session determines the real user.
  const userIdInPath = pathname.match(/\/(?:user|u|profile)\/([^/]+)/)?.[1];
  if (userIdInPath) {
    // Get the logged-in user's id from the Supabase auth cookie
    const authCookieKey = Object.keys(Object.fromEntries(request.cookies))
      .find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (authCookieKey) {
      try {
        const raw = request.cookies.get(authCookieKey)?.value ?? '';
        const parsed = JSON.parse(decodeURIComponent(raw));
        const sessionUserId: string | undefined = parsed?.user?.id ?? parsed?.[0]?.user?.id;
        if (sessionUserId && sessionUserId !== userIdInPath) {
          // Someone is trying to access another user's URL — send them home
          const safeUrl = request.nextUrl.clone();
          safeUrl.pathname = '/';
          return NextResponse.redirect(safeUrl, { status: 302 });
        }
      } catch {
        // Malformed cookie — redirect to root
        const safeUrl = request.nextUrl.clone();
        safeUrl.pathname = '/';
        return NextResponse.redirect(safeUrl, { status: 302 });
      }
    }
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
