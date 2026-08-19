import { adsPeriodDateRange, type PeriodId } from '@/app/dashboard/lead-utils';

/**
 * Leitura da Meta Marketing API para o painel /dash-ads. Server-side apenas
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

/** time_range da Meta (JSON) para o periodo. Usa a mesma janela do Google
 *  (N dias terminando ontem), para os dois paineis baterem entre si e com as
 *  interfaces nativas. */
function metaTimeRange(period: PeriodId): string {
  const { since, until } = adsPeriodDateRange(period);
  return JSON.stringify({ since, until });
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

const DAY_S = 86400;
/** Sao Paulo e UTC-3 (sem horario de verao desde 2019). */
const spTs = (d: string, endOfDay = false) =>
  Math.floor(new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}-03:00`).getTime() / 1000);

/**
 * Seguidores ganhos (liquido) no periodo, via IG insights follower_count.
 *
 * Cuidado de fuso: o follower_count bucketiza por dia do PACIFICO (end_time as
 * ~07:00 UTC), e o end_time e o fim EXCLUSIVO do dia. Uma janela ingenua em
 * Sao Paulo pega o bucket do dia errado (era o bug do filtro "Ontem"). Por isso
 * consultamos uma janela folgada e somamos so os buckets cujo DIA REPRESENTADO
 * (end_time - 1 dia) cai no periodo pedido — mesma logica que o gerenciador usa.
 * Requer instagram_manage_insights; sem a permissao, retorna undefined.
 */
async function fetchFollowerGrowth(
  igId: string,
  period: PeriodId,
  token: string,
): Promise<number | undefined> {
  const { since, until } = adsPeriodDateRange(period);
  // Folga de meio dia dos dois lados para nao perder o bucket do Pacifico; limita
  // a 30 dias, que e o maximo que o follower_count cobre.
  const untilTs = spTs(until, true) + DAY_S / 2;
  const sinceTs = Math.max(spTs(since) - DAY_S / 2, untilTs - 30 * DAY_S);

  try {
    const data = (await graph(
      `${igId}/insights`,
      { metric: 'follower_count', period: 'day', since: String(sinceTs), until: String(untilTs) },
      token,
    )) as { data?: { values?: { value?: number; end_time?: string }[] }[] };

    const values = data.data?.[0]?.values ?? [];
    if (values.length === 0) return undefined;

    let sum = 0;
    for (const v of values) {
      if (!v.end_time) continue;
      // Dia representado = end_time menos 1 dia, como data (YYYY-MM-DD).
      const repDate = new Date(new Date(v.end_time).getTime() - DAY_S * 1000).toISOString().slice(0, 10);
      if (repDate >= since && repDate <= until) sum += v.value ?? 0;
    }
    return sum;
  } catch {
    // Sem permissao de insights do IG: o painel cai para o total de seguidores.
    return undefined;
  }
}

/** Resolve o id de uma campanha pelo nome exato (ou undefined se nao existir). */
async function resolveCampaignId(account: string, token: string, name: string): Promise<string | undefined> {
  const data = (await graph(
    `${account}/campaigns`,
    { fields: 'id,name', limit: '500' },
    token,
  )) as { data?: { id: string; name: string }[] };
  return data.data?.find((c) => c.name === name)?.id;
}

/**
 * Painel de UMA campanha (por nome). Os totais e a serie diaria vem do proprio
 * no da campanha (`{campaignId}/insights`), entao ja chegam escopados — nada de
 * somar a conta inteira. Segue a mesma janela de datas do resto do painel.
 */
async function fetchCampaignScoped(
  account: string,
  token: string,
  period: PeriodId,
  timeRange: string,
  campaign: string,
  wantFollowers: boolean,
): Promise<AdsResponse> {
  const campaignId = await resolveCampaignId(account, token, campaign);

  const follow = wantFollowers ? await fetchFollowers(token) : {};
  const followersGained =
    wantFollowers && follow.igId ? await fetchFollowerGrowth(follow.igId, period, token) : undefined;

  // Campanha nao encontrada: devolve zeros (o painel ainda carrega, sem inventar).
  if (!campaignId) {
    return {
      sample: false,
      totals: { spend: 0, impressions: 0, clicks: 0, results: 0 },
      series: [],
      campaigns: [],
      followers: wantFollowers ? follow.followers : undefined,
      followersGained,
      followersHandle: wantFollowers ? follow.handle : undefined,
      fetchedAt: new Date().toISOString(),
    };
  }

  const [totalsData, dailyData] = (await Promise.all([
    graph(`${campaignId}/insights`, { fields: 'spend,impressions,clicks,actions', time_range: timeRange }, token),
    graph(`${campaignId}/insights`, { fields: 'spend', time_range: timeRange, time_increment: '1' }, token),
  ])) as [{ data?: InsightRow[] }, { data?: InsightRow[] }];

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

  const campaigns: AdsResponse['campaigns'] = totalRow
    ? [{ name: campaign, spend: totals.spend, clicks: totals.clicks, results: totals.results }]
    : [];

  return {
    sample: false,
    totals,
    series,
    campaigns,
    followers: wantFollowers ? follow.followers : undefined,
    followersGained,
    followersHandle: wantFollowers ? follow.handle : undefined,
    fetchedAt: new Date().toISOString(),
  };
}

/** Opcoes do painel Meta: escopar numa campanha e/ou incluir seguidores. */
export type MetaOptions = { campaign?: string; followers?: boolean };

// Cache simples em memoria (por instancia), chaveado por periodo + opcoes.
const cache = new Map<string, { at: number; value: AdsResponse }>();

export async function fetchMetaAds(period: PeriodId, options: MetaOptions = {}): Promise<AdsResponse> {
  const { campaign, followers: wantFollowers = true } = options;
  const cacheKey = `${period}|${campaign ?? ''}|${wantFollowers}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const { token, account } = config();
  const timeRange = metaTimeRange(period);

  if (campaign) {
    const scoped = await fetchCampaignScoped(account, token, period, timeRange, campaign, wantFollowers);
    cache.set(cacheKey, { at: Date.now(), value: scoped });
    return scoped;
  }

  // 1) Totais da conta. 2) Serie diaria de investimento. 3) Campanhas ativas.
  const [totalsData, dailyData, activeCampaigns, follow] = await Promise.all([
    graph(`${account}/insights`, { fields: 'spend,impressions,clicks,actions', time_range: timeRange, level: 'account' }, token) as Promise<{ data?: InsightRow[] }>,
    graph(`${account}/insights`, { fields: 'spend', time_range: timeRange, level: 'account', time_increment: '1' }, token) as Promise<{ data?: InsightRow[] }>,
    graph(`${account}/campaigns`, { fields: 'id,name', filtering: '[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]', limit: '100' }, token) as Promise<{ data?: { id: string; name: string }[] }>,
    wantFollowers ? fetchFollowers(token) : Promise.resolve({} as Awaited<ReturnType<typeof fetchFollowers>>),
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
      { fields: 'campaign_id,campaign_name,spend,clicks,actions', time_range: timeRange, level: 'campaign', limit: '200' },
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

  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}
