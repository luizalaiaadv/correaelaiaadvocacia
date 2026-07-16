import { NextResponse } from 'next/server';
import { SESSION_COOKIE, safeEqual, sessionToken } from '@/lib/dashboard-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: 'DASHBOARD_PASSWORD nao configurada no ambiente.' },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? '';

  if (!safeEqual(password, expected)) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await sessionToken(expected), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
