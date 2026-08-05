import type { PeriodId } from '@/app/dashboard/lead-utils';

/**
 * Leitura da Meta Marketing API para o dashboard /dash-meta. Server-side apenas
 * (usa o token secreto). Sem SDK: a Graph API resolve com fetch puro.
 */

const API = 'https://graph.facebook.com/v21.0';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 min: o painel nao deve martelar a API

export class MetaConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Variaveis ausentes no ambiente: ${missing.join(', ')}.`);
    this.name = 'MetaConfigError';
  }
}

export type AdsResponse = {
  sample: boolean;
  totals: { spend: number; impressions: number; clicks: number; results: number };
  series: { key: string; spend: number }[];
  campaigns: { name: string; spend: number; clicks: number; results: number }[];
  followers?: number;
  /** Seguidores ganhos no periodo (como o Business Suite). Requer permissao
   *  instagram_manage_insights no token; sem ela, fica indefinido. */
  followersGained?: number;
  followersHandle?: string;
  fetchedAt: string;
};

function config() {
  const token = process.env.META_ACCESS_TOKEN;
  const rawAccount = process.env.META_AD_ACCOUNT_ID;
  const missing = [!token && 'META_ACCESS_TOKEN', !rawAccount && 'META_AD_ACCOUNT_ID'].filter(
    (n): n is string => Boolean(n),
  );
  if (missing.length > 0) throw new MetaConfigError(missing);
  // Tolera o id com ou sem o prefixo act_.
  const account = rawAccount!.startsWith('act_') ? rawAccount! : `act_${rawAccount}`;
  return { token: token as string, account };
}

/** PeriodId do app -> date_preset da Meta. */
function datePreset(period: PeriodId): string {
  switch (period) {
    case 'today':
      return 'today';
    case 'yesterday':
      return 'yesterday';
    case '7d':
      return 'last_7d';
    case '14d':
      return 'last_14d';
    case 'all':
      return 'maximum';
  }
}

async function graph(path: string, params: Record<string, string>, token: string): Promise<unknown> {
  const url = new URL(`${API}/${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const response = await fetch(url, { cache: 'no-store' });
  const data = (await response.json()) as { error?: { message?: string } };
  if (!response.ok || data.error) {
    throw new Error(`Meta API ${response.status}: ${data.error?.message ?? 'erro desconhecido'}`);
  }
  return data;
}

type InsightRow = {
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  campaign_id?: string;
  campaign_name?: string;
  actions?: { action_type: string; value: string }[];
};

const num = (v?: string) => (v ? Number(v) : 0);
const linkClicks = (row: InsightRow) =>
  num(row.actions?.find((a) => a.action_type === 'link_click')?.value);

async function fetchFollowers(
  token: string,
): Promise<{ followers?: number; handle?: string; igId?: string }> {
  try {
    const data = (await graph(
      'me/accounts',
      { fields: 'instagram_business_account{id,username,followers_count}' },
      token,
    )) as { data?: { instagram_business_account?: { id?: string; username?: string; followers_count?: number } }[] };

    for (const page of data.data ?? []) {
      const ig = page.instagram_business_account;
      if (ig?.followers_count !== undefined) {
        return { followers: ig.followers_count, handle: ig.username, igId: ig.id };
      }
    }
  } catch {
    // Seguidores e um "extra": se falhar, o resto do painel ainda vale.
  }
  return {};
}

/** Janela (em segundos Unix) de cada periodo para o crescimento de seguidores. */
function growthWindow(period: PeriodId): { since: number; until: number } {
  const day = 86400;
  const now = Math.floor(Date.now() / 1000);
  switch (period) {
    case 'today':
      return { since: now - day, until: now };
    case 'yesterday':
      return { since: now - 2 * day, until: now - day };
    case '7d':
      return { since: now - 7 * day, until: now };
    case '14d':
      return { since: now - 14 * day, until: now };
    case 'all':
      // follower_count so retorna ate 30 dias — limite da API.
      return { since: now - 30 * day, until: now };
  }
}

/** Seguidores ganhos (liquido) no periodo, via IG insights follower_count.
 *  Requer instagram_manage_insights; sem a permissao, retorna undefined. */
async function fetchFollowerGrowth(
  igId: string,
  period: PeriodId,
  token: string,
): Promise<number | undefined> {
  const { since, until } = growthWindow(period);
  try {
    const data = (await graph(
      `${igId}/insights`,
      { metric: 'follower_count', period: 'day', since: String(since), until: String(until) },
      token,
    )) as { data?: { values?: { value?: number }[] }[] };
    const values = data.data?.[0]?.values ?? [];
    return values.reduce((sum, v) => sum + (v.value ?? 0), 0);
  } catch {
    // Sem permissao de insights do IG: o painel cai para o total de seguidores.
    return undefined;
  }
}

// Cache simples em memoria (por instancia), chaveado por periodo.
const cache = new Map<string, { at: number; value: AdsResponse }>();

export async function fetchMetaAds(period: PeriodId): Promise<AdsResponse> {
  const cached = cache.get(period);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const { token, account } = config();
  const preset = datePreset(period);

  // 1) Totais da conta. 2) Serie diaria de investimento. 3) Campanhas ativas.
  const [totalsData, dailyData, activeCampaigns, follow] = await Promise.all([
    graph(`${account}/insights`, { fields: 'spend,impressions,clicks,actions', date_preset: preset, level: 'account' }, token) as Promise<{ data?: InsightRow[] }>,
    graph(`${account}/insights`, { fields: 'spend', date_preset: preset, level: 'account', time_increment: '1' }, token) as Promise<{ data?: InsightRow[] }>,
    graph(`${account}/campaigns`, { fields: 'id,name', filtering: '[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]', limit: '100' }, token) as Promise<{ data?: { id: string; name: string }[] }>,
    fetchFollowers(token),
  ]);

  const totalRow = totalsData.data?.[0];
  const totals = {
    spend: num(totalRow?.spend),
    impressions: num(totalRow?.impressions),
    clicks: num(totalRow?.clicks),
    results: totalRow ? linkClicks(totalRow) : 0,
  };

  const series = (dailyData.data ?? [])
    .filter((r) => r.date_start)
    .map((r) => ({ key: r.date_start as string, spend: num(r.spend) }));

  // Insights por campanha, mantendo so as ativas (nome real vem da API).
  const activeIds = new Set((activeCampaigns.data ?? []).map((c) => c.id));
  let campaigns: AdsResponse['campaigns'] = [];
  if (activeIds.size > 0) {
    const campData = (await graph(
      `${account}/insights`,
      { fields: 'campaign_id,campaign_name,spend,clicks,actions', date_preset: preset, level: 'campaign', limit: '200' },
      token,
    )) as { data?: InsightRow[] };
    campaigns = (campData.data ?? [])
      .filter((r) => r.campaign_id && activeIds.has(r.campaign_id))
      .map((r) => ({
        name: r.campaign_name ?? 'Campanha',
        spend: num(r.spend),
        clicks: num(r.clicks),
        results: linkClicks(r),
      }))
      .sort((a, b) => b.spend - a.spend);
  }

  // Seguidores ganhos no periodo (se o token tiver permissao de insights do IG).
  const followersGained = follow.igId ? await fetchFollowerGrowth(follow.igId, period, token) : undefined;

  const value: AdsResponse = {
    sample: false,
    totals,
    series,
    campaigns,
    followers: follow.followers,
    followersGained,
    followersHandle: follow.handle,
    fetchedAt: new Date().toISOString(),
  };

  cache.set(period, { at: Date.now(), value });
  return value;
}
