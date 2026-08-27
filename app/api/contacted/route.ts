import { NextResponse } from 'next/server';
import { SupabaseConfigError, listContacted, markContacted, unmarkContacted } from '@/lib/contacted-store';

export const dynamic = 'force-dynamic';

/** Mensagem curta (sem stack) — inclui o codigo da causa quando houver, ex.:
 *  "fetch failed (ENOTFOUND)" quando o projeto Supabase esta pausado/fora do ar. */
function describe(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as { cause?: { code?: string } }).cause;
    return cause?.code ? `${error.message} (${cause.code})` : error.message;
  }
  return String(error);
}

function errorResponse(error: unknown) {
  if (error instanceof SupabaseConfigError) {
    console.error('[api/contacted] config ausente:', error.missing.join(', '));
    return NextResponse.json(
      { error: `Configuracao ausente no servidor: ${error.missing.join(', ')}.`, code: 'config_missing' },
      { status: 500 },
    );
  }
  // Banco fora do ar (ex.: projeto Supabase pausado): uma linha, sem stack —
  // a lista de leads segue funcionando, so a marca de "contatado" nao persiste.
  console.warn('[api/contacted] banco de marcacoes indisponivel:', describe(error));
  return NextResponse.json(
    { error: 'O banco de marcacoes nao respondeu.', code: 'upstream_error' },
    { status: 502 },
  );
}

export async function GET() {
  try {
    const ids = await listContacted();
    return NextResponse.json({ ids }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

const MAX_BATCH = 500;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { mark?: unknown; unmark?: unknown } | null;

  const sanitize = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length < 100).slice(0, MAX_BATCH)
      : [];

  const mark = sanitize(body?.mark);
  const unmark = sanitize(body?.unmark);

  if (mark.length === 0 && unmark.length === 0) {
    return NextResponse.json({ error: 'Nada para marcar ou desmarcar.' }, { status: 400 });
  }

  try {
    await Promise.all([markContacted(mark), unmarkContacted(unmark)]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
