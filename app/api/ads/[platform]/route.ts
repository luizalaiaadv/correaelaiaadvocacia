import { NextResponse } from 'next/server';
import { fetchMetaAds, MetaConfigError } from '@/lib/meta-ads';
import { fetchGoogleAds, GoogleConfigError } from '@/lib/google-ads';
import { isDateKey, type DateRange, type PeriodId } from '@/app/dashboard/lead-utils';

export const dynamic = 'force-dynamic';

const PERIODS: PeriodId[] = ['today', 'yesterday', '7d', '14d', '30d', 'all'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const url = new URL(request.url);
  const periodParam = url.searchParams.get('period') as PeriodId | null;
  const period: PeriodId = periodParam && PERIODS.includes(periodParam) ? periodParam : '7d';
  // Escopo opcional numa campanha, pelo ID do Meta.
  const campaignId = url.searchParams.get('campaignId') || undefined;

  // Intervalo personalizado (date picker). So vale se as DUAS datas forem
  // YYYY-MM-DD validas; caso contrario cai no preset.
  const since = url.searchParams.get('since');
  const until = url.searchParams.get('until');
  const range: DateRange | undefined =
    isDateKey(since) && isDateKey(until) ? { since, until } : undefined;

  try {
    if (platform === 'meta') {
      const data = await fetchMetaAds(period, { campaignId, range });
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (platform === 'google') {
      const data = await fetchGoogleAds(period, range);
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
