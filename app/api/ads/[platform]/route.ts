import { NextResponse } from 'next/server';
import { fetchMetaAds, MetaConfigError } from '@/lib/meta-ads';
import { fetchGoogleAds, GoogleConfigError } from '@/lib/google-ads';
import type { PeriodId } from '@/app/dashboard/lead-utils';

export const dynamic = 'force-dynamic';

const PERIODS: PeriodId[] = ['today', 'yesterday', '7d', '14d', 'all'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const url = new URL(request.url);
  const periodParam = url.searchParams.get('period') as PeriodId | null;
  const period: PeriodId = periodParam && PERIODS.includes(periodParam) ? periodParam : '7d';

  try {
    if (platform === 'meta') {
      const data = await fetchMetaAds(period);
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
