import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, safeEqual, sessionToken } from './lib/dashboard-auth';

const LOGIN_PATH = '/dashboard/login';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const password = process.env.DASHBOARD_PASSWORD;

  if (!password) {
    return NextResponse.json(
      { error: 'DASHBOARD_PASSWORD nao configurada no ambiente.' },
      { status: 500 },
    );
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? '';
  const isAuthenticated = safeEqual(cookie, await sessionToken(password));

  if (pathname === LOGIN_PATH) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isAuthenticated) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 });
  }

  return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/dash-meta/:path*', '/dash-google/:path*', '/api/leads', '/api/contacted', '/api/ads/:path*'],
};
