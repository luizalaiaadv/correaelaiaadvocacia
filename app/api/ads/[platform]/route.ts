import { NextResponse } from 'next/server';
import { fetchMetaAds, MetaConfigError } from '@/lib/meta-ads';
import { fetchGoogleAds, GoogleConfigError } from '@/lib/google-ads';
import { fetchLeads } from '@/lib/typebot';
import { adsPeriodDateRange, dayKey, type PeriodId } from '@/app/dashboard/lead-utils';

export const dynamic = 'force-dynamic';

const PERIODS: PeriodId[] = ['today', 'yesterday', '7d', '14d', '30d', 'all'];

/** Quantos leads chegaram no Typebot dentro da janela do periodo (mesma janela
 *  das datas do painel de ads). Para "todo o periodo", conta todos. */
async function countLeadsInPeriod(period: PeriodId): Promise<number> {
  const leads = await fetchLeads();
  if (period === 'all') return leads.length;
  const { since, until } = adsPeriodDateRange(period);
  return leads.filter((l) => {
    const k = dayKey(new Date(l.createdAt));
    return k >= since && k <= until;
  }).length;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const url = new URL(request.url);
  const periodParam = url.searchParams.get('period') as PeriodId | null;
  const period: PeriodId = periodParam && PERIODS.includes(periodParam) ? periodParam : '7d';
  // Escopo opcional numa campanha (nome exato) e origem dos "Resultados".
  const campaign = url.searchParams.get('campaign') || undefined;
  const resultsFromTypebot = url.searchParams.get('results') === 'typebot';

  try {
    if (platform === 'meta') {
      const data = await fetchMetaAds(period, { campaign, followers: !resultsFromTypebot });

      // Aba Typebot: "Resultados" = leads reais que chegaram no Typebot (nao a
      // conversao da campanha). Se o Typebot falhar, mantem o dado do Meta.
      if (resultsFromTypebot) {
        try {
          const leadCount = await countLeadsInPeriod(period);
          data.totals.results = leadCount;
          data.campaigns = data.campaigns.map((c) => ({ ...c, results: leadCount }));
        } catch (leadError) {
          console.error('[api/ads] leads para Resultados', leadError);
        }
      }

      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (platform === 'google') {
      const data = await fetchGoogleAds(period);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Plataforma invalida.' }, { status: 404 });
  } catch (error) {
    console.error('[api/ads]', error);
    if (error instanceof MetaConfigError || error instanceof GoogleConfigError) {
      return NextResponse.json(
        { error: `Configuracao ausente no servidor: ${error.missing.join(', ')}.`, code: 'config_missing' },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: `Nao foi possivel carregar os dados do ${platform === 'meta' ? 'Meta' : 'Google'} Ads.`, code: 'upstream_error' },
      { status: 502 },
    );
  }
}
