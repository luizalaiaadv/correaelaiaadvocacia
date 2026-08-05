import type { PeriodId } from '../dashboard/lead-utils';
import type { AdsResponse } from '@/lib/meta-ads';
import { sampleAdsData, type PlatformId } from './config';

/** Converte os dados de exemplo para o formato AdsResponse (usado enquanto a
 *  plataforma nao tem API real ligada — hoje, o Google). */
export function sampleResponse(platform: PlatformId, period: PeriodId, now = Date.now()): AdsResponse {
  const data = sampleAdsData(platform, period, now);
  return {
    sample: true,
    totals: {
      spend: data.totals.spend,
      impressions: data.totals.impressions,
      clicks: data.totals.clicks,
      results: data.totals.conversions,
    },
    series: data.series.map((d) => ({ key: d.key, spend: d.spend })),
    campaigns: data.campaigns.map((c) => ({
      name: c.name,
      spend: c.spend,
      clicks: c.clicks,
      results: c.conversions,
    })),
    fetchedAt: new Date().toISOString(),
  };
}
