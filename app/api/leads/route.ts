import { NextResponse } from 'next/server';
import { TypebotConfigError, fetchLeads } from '@/lib/typebot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leads = await fetchLeads();
    return NextResponse.json(
      { leads, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[api/leads]', error);

    // Nomes de variaveis nao sao segredo (os valores sim), entao podem ir para o
    // cliente: sem isso um erro de configuracao fica indistinguivel de queda do Typebot.
    if (error instanceof TypebotConfigError) {
      return NextResponse.json(
        {
          error: `Configuracao ausente no servidor: ${error.missing.join(', ')}.`,
          code: 'config_missing',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'O Typebot nao respondeu. Tente novamente em instantes.', code: 'upstream_error' },
      { status: 502 },
    );
  }
}
