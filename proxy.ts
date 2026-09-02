import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/dashboard-auth';

const LOGIN_PATH = '/dash-ads/login';
// Painel de anuncios: uma rota so, com seletor Meta/Google dentro.
const HOME_PATH = '/dash-ads';

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
  const isAuthenticated = await verifySession(cookie, password);

  if (pathname === LOGIN_PATH) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(HOME_PATH, request.url));
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
  matcher: [
    '/dashboard/:path*',
    '/dash-ads/:path*',
    '/api/leads',
    '/api/contacted',
    '/api/ads/:path*',
    // Só a inscrição exige login. `/api/push/check-balance` fica FORA de
    // propósito: quem chama é o cron da Vercel, que se autentica pelo CRON_SECRET
    // e não tem cookie de sessão.
    '/api/push/subscribe',
  ],
};
