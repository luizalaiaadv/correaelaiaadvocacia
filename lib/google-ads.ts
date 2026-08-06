import type { PeriodId } from '@/app/dashboard/lead-utils';
import type { AdsResponse } from '@/lib/meta-ads';

/**
 * Leitura da Google Ads API (REST) para o painel /dash-ads. Server-side apenas.
 * Sem SDK: troca o refresh token por um access token e consulta via GAQL.
 */

const OAUTH = 'https://oauth2.googleapis.com/token';
const API = 'https://googleads.googleapis.com/v21';
const CACHE_TTL_MS = 3 * 60 * 1000;

export class GoogleConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Variaveis ausentes no ambiente: ${missing.join(', ')}.`);
    this.name = 'GoogleConfigError';
  }
}

function config() {
  const env = {
    devToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
  };
  const missing = (
    [
      ['GOOGLE_ADS_DEVELOPER_TOKEN', env.devToken],
      ['GOOGLE_ADS_CLIENT_ID', env.clientId],
      ['GOOGLE_ADS_CLIENT_SECRET', env.clientSecret],
      ['GOOGLE_ADS_REFRESH_TOKEN', env.refreshToken],
      ['GOOGLE_ADS_CUSTOMER_ID', env.customerId],
    ] as const
  )
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) throw new GoogleConfigError(missing);
  // ids sem hifens
  const clean = (v?: string) => (v ?? '').replace(/-/g, '');
  return {
    devToken: env.devToken as string,
    clientId: env.clientId as string,
    clientSecret: env.clientSecret as string,
    refreshToken: env.refreshToken as string,
    loginCustomerId: clean(env.loginCustomerId),
    customerId: clean(env.customerId),
  };
}

// Access token reaproveitado ate perto de expirar.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(cfg: ReturnType<typeof config>): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: cfg.refreshToken,
    grant_type: 'refresh_token',
  });
  const response = await fetch(OAUTH, { method: 'POST', body, cache: 'no-store' });
  const data = (await response.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(`Google OAuth ${response.status}: ${data.error ?? 'sem access_token'}`);
  }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };
  return data.access_token;
}

type GaqlRow = {
  segments?: { date?: string };
  campaign?: { name?: string };
  metrics?: { costMicros?: string; impressions?: string; clicks?: string; conversions?: number };
};

async function gaql(cfg: ReturnType<typeof config>, token: string, query: string): Promise<GaqlRow[]> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'developer-token': cfg.devToken,
    'Content-Type': 'application/json',
  };
  if (cfg.loginCustomerId) headers['login-customer-id'] = cfg.loginCustomerId;

  // A Google Ads API solta erros transitorios (ja vimos um HTTP 400 que sumiu no
  // retry). Uma tentativa extra evita mostrar erro ao cliente sem motivo real.
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400));

    const response = await fetch(`${API}/customers/${cfg.customerId}/googleAds:searchStream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
      cache: 'no-store',
    });
    const data = (await response.json()) as unknown;

    if (response.ok) {
      // searchStream devolve um array de batches, cada um com results[].
      const batches = (Array.isArray(data) ? data : [data]) as { results?: GaqlRow[] }[];
      return batches.flatMap((b) => b.results ?? []);
    }

    lastError =
      (Array.isArray(data) ? undefined : (data as { error?: { message?: string } })?.error?.message) ??
      `HTTP ${response.status}`;
  }
  throw new Error(`Google Ads API: ${lastError}`);
}

const TZ = 'America/Sao_Paulo';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dateKey = (d: Date) => dayFmt.format(d);

/** Janela de datas (YYYY-MM-DD) para cada periodo. */
function dateRange(period: PeriodId, now = Date.now()): { since: string; until: string } {
  const day = 86_400_000;
  const today = dateKey(new Date(now));
  switch (period) {
    case 'today':
      return { since: today, until: today };
    case 'yesterday': {
      const y = dateKey(new Date(now - day));
      return { since: y, until: y };
    }
    case '7d':
      return { since: dateKey(new Date(now - 6 * day)), until: today };
    case '14d':
      return { since: dateKey(new Date(now - 13 * day)), until: today };
    case 'all':
      // Janela larga o bastante para "todo o periodo", mas finita (exigencia da API)
      // e usavel no grafico.
      return { since: dateKey(new Date(now - 29 * day)), until: today };
  }
}

const micros = (v?: string) => (v ? Number(v) / 1e6 : 0);
const int = (v?: string) => (v ? Number(v) : 0);

const cache = new Map<string, { at: number; value: AdsResponse }>();

export async function fetchGoogleAds(period: PeriodId): Promise<AdsResponse> {
  const cached = cache.get(period);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const cfg = config();
  const token = await getAccessToken(cfg);
  const { since, until } = dateRange(period);
  const range = `segments.date BETWEEN '${since}' AND '${until}'`;

  // 1) Serie diaria (nivel conta). 2) Campanhas ATIVAS agregadas no periodo.
  const [dailyRows, campaignRows] = await Promise.all([
    gaql(
      cfg,
      token,
      `SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM customer WHERE ${range} ORDER BY segments.date`,
    ),
    gaql(
      cfg,
      token,
      `SELECT campaign.name, metrics.cost_micros, metrics.clicks, metrics.conversions FROM campaign WHERE ${range} AND campaign.status = 'ENABLED'`,
    ),
  ]);

  const series = dailyRows
    .filter((r) => r.segments?.date)
    .map((r) => ({ key: r.segments!.date as string, spend: micros(r.metrics?.costMicros) }));

  const totals = dailyRows.reduce(
    (acc, r) => ({
      spend: acc.spend + micros(r.metrics?.costMicros),
      impressions: acc.impressions + int(r.metrics?.impressions),
      clicks: acc.clicks + int(r.metrics?.clicks),
      results: acc.results + (r.metrics?.conversions ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, results: 0 },
  );

  const campaigns = campaignRows
    .map((r) => ({
      name: r.campaign?.name ?? 'Campanha',
      spend: micros(r.metrics?.costMicros),
      clicks: int(r.metrics?.clicks),
      results: r.metrics?.conversions ?? 0,
    }))
    .sort((a, b) => b.spend - a.spend);

  const value: AdsResponse = {
    sample: false,
    totals: {
      spend: totals.spend,
      impressions: totals.impressions,
      clicks: totals.clicks,
      results: Math.round(totals.results),
    },
    series,
    campaigns: campaigns.map((c) => ({ ...c, results: Math.round(c.results) })),
    fetchedAt: new Date().toISOString(),
  };

  cache.set(period, { at: Date.now(), value });
  return value;
}
