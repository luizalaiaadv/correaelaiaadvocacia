import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, createSession, safeEqual, verifySession } from '@/lib/dashboard-auth';

export const dynamic = 'force-dynamic';

function setSessionCookie(response: NextResponse, value: string, maxAgeSec: number) {
  response.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  });
}

/** Login com senha. */
export async function POST(request: Request) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'DASHBOARD_PASSWORD nao configurada no ambiente.' }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!safeEqual(body?.password ?? '', expected)) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

  const { value, maxAgeSec } = await createSession(expected);
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, value, maxAgeSec);
  return response;
}

/**
 * "Toque" de atividade: se a sessao ainda e valida, renova a expiracao
 * (timeout deslizante por inatividade). Chamado pelo cliente so em atividade
 * real do usuario — nao no polling automatico.
 */
export async function PATCH() {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'DASHBOARD_PASSWORD nao configurada no ambiente.' }, { status: 500 });
  }

  const current = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
  if (!(await verifySession(current, expected))) {
    return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 });
  }

  const { value, maxAgeSec } = await createSession(expected);
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, value, maxAgeSec);
  return response;
}

/** Logout. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
