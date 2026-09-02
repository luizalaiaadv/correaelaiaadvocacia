import { NextResponse } from 'next/server';
import { saveSubscription } from '@/lib/push-store';

export const dynamic = 'force-dynamic';

/**
 * Registra o aparelho para receber o aviso de saldo. Protegida pela senha do
 * painel (o `proxy` cobre /api/push), entao so quem ja esta logado se inscreve.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  } | null;

  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : '';
  const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : '';

  if (!endpoint.startsWith('https://') || !p256dh || !auth) {
    return NextResponse.json({ error: 'Inscricao invalida.' }, { status: 400 });
  }

  try {
    await saveSubscription({ endpoint, p256dh, auth });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('[api/push/subscribe]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Nao foi possivel salvar a inscricao.' }, { status: 502 });
  }
}
