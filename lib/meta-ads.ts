import { resolveAdsRange, type DateRange, type PeriodId } from '@/app/dashboard/lead-utils';

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

/** Saldo restante da CONTA (independe do periodo/campanha). `remaining` e `limit`
 *  ja vem na unidade da moeda (nao em centavos/micros). */
export type AdsBalance = {
  remaining: number;
  currency: string;
  /** Teto (limite de gasto / orcamento da conta), para a UI marcar "saldo baixo". */
  limit?: number;
  /** Origem do numero, ex.: "Saldo disponível" (Meta pre-pago) ou "Orçamento da conta". */
  label?: string;
};

/**
 * Metricas de video e de perfil — o que importa numa campanha de TRAFEGO PARA O
 * PERFIL (ganhar seguidores) com criativo em video. So o Meta preenche.
 */
export type AdsVideoStats = {
  reach: number;
  frequency: number;
  cpm: number;
  /** Reproducoes iniciadas (o video comecou a rodar). */
  plays: number;
  /** Views de 3 segundos — base do "hook rate". */
  views3s: number;
  /** Assistiu 15s ou ate o fim. */
  thruplays: number;
  avgWatchSeconds: number;
  /** Retencao: quantos chegaram a 25/50/75/100% do video. */
  p25: number;
  p50: number;
  p75: number;
  p100: number;
  saves: number;
  shares: number;
  /** Visitas ao perfil no periodo (Instagram insights). */
  profileViews?: number;
};

export type AdsResponse = {
  sample: boolean;
  totals: { spend: number; impressions: number; clicks: number; results: number };
  series: { key: string; spend: number }[];
  campaigns: { name: string; spend: number; clicks: number; results: number }[];
  /** Metricas de video/perfil (Meta). Ausente no Google. */
  video?: AdsVideoStats;
  followers?: number;
  /** Seguidores ganhos no periodo (como o Business Suite). Requer permissao
   *  instagram_manage_insights no token; sem ela, fica indefinido. */
  followersGained?: number;
  followersHandle?: string;
  /** Saldo restante da conta de anuncios (alerta no topo do painel). */
  balance?: AdsBalance;
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

/** time_range da Meta (JSON) a partir da janela ja resolvida (preset ou
 *  personalizada). Mesma janela do Google, para os dois paineis baterem entre si
 *  e com as interfaces nativas. */
function metaTimeRange(range: DateRange): string {
  return JSON.stringify({ since: range.since, until: range.until });
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

/** Lista de acoes da Graph API: [{action_type, value}]. */
type ActionList = { action_type: string; value: string }[];

type InsightRow = {
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  campaign_id?: string;
  campaign_name?: string;
  reach?: string;
  frequency?: string;
  cpm?: string;
  actions?: ActionList;
  video_play_actions?: ActionList;
  video_thruplay_watched_actions?: ActionList;
  video_avg_time_watched_actions?: ActionList;
  video_p25_watched_actions?: ActionList;
  video_p50_watched_actions?: ActionList;
  video_p75_watched_actions?: ActionList;
  video_p100_watched_actions?: ActionList;
};

/** Campos de insights pedidos quando queremos as metricas de video/perfil. */
const VIDEO_FIELDS =
  'reach,frequency,cpm,video_play_actions,video_thruplay_watched_actions,video_avg_time_watched_actions,' +
  'video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions';

const num = (v?: string) => (v ? Number(v) : 0);
/** Valor de um action_type dentro de uma lista de acoes. */
const action = (list: ActionList | undefined, type = 'video_view') =>
  num(list?.find((a) => a.action_type === type)?.value);
const linkClicks = (row: InsightRow) => action(row.actions, 'link_click');

/** Monta as metricas de video/perfil a partir da linha de insights da campanha. */
function videoStats(row: InsightRow | undefined, profileViews?: number): AdsVideoStats | undefined {
  if (!row) return undefined;
  return {
    reach: num(row.reach),
    frequency: num(row.frequency),
    cpm: num(row.cpm),
    plays: action(row.video_play_actions),
    // Na Graph API, actions.video_view = visualizacoes de 3 segundos.
    views3s: action(row.actions, 'video_view'),
    thruplays: action(row.video_thruplay_watched_actions),
    avgWatchSeconds: action(row.video_avg_time_watched_actions),
    p25: action(row.video_p25_watched_actions),
    p50: action(row.video_p50_watched_actions),
    p75: action(row.video_p75_watched_actions),
    p100: action(row.video_p100_watched_actions),
    saves: action(row.actions, 'onsite_conversion.post_save'),
    // action_type "post" = compartilhamentos da publicacao.
    shares: action(row.actions, 'post'),
    profileViews,
  };
}

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

/** Extrai um valor em BRL de um texto tipo "Saldo disponível (R$1.234,56 BRL)". */
function parseBrl(text: string): number | undefined {
  const m = text.match(/R\$\s*([\d.]+),(\d{2})/);
  if (!m) return undefined;
  const value = Number(`${m[1].replace(/\./g, '')}.${m[2]}`);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Saldo restante da conta de anuncios. Conta pre-paga -> usa o "Saldo disponível"
 * do funding source (o mesmo que aparece no gerenciador). Sem pre-pago -> quanto
 * falta para o limite de gasto (spend_cap - amount_spent). E um "extra": se
 * falhar, o painel ainda vale (retorna undefined).
 */
async function fetchAccountBalance(account: string, token: string): Promise<AdsBalance | undefined> {
  try {
    const d = (await graph(
      account,
      { fields: 'currency,spend_cap,amount_spent,funding_source_details' },
      token,
    )) as {
      currency?: string;
      spend_cap?: string;
      amount_spent?: string;
      funding_source_details?: { display_string?: string; type?: number };
    };

    const currency = d.currency ?? 'BRL';
    const cap = d.spend_cap ? Number(d.spend_cap) : 0;
    const spent = d.amount_spent ? Number(d.amount_spent) : 0;
    const limit = cap > 0 ? cap / 100 : undefined;

    const prepaid = parseBrl(d.funding_source_details?.display_string ?? '');
    if (prepaid !== undefined) {
      return { remaining: prepaid, currency, limit, label: 'Saldo disponível' };
    }
    if (cap > 0) {
      return { remaining: Math.max(0, (cap - spent) / 100), currency, limit, label: 'Disponível no limite' };
    }
    return undefined;
  } catch {
    return undefined;
  }
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
  range: DateRange,
  token: string,
): Promise<number | undefined> {
  const { since, until } = range;
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

/**
 * Visitas ao perfil no periodo (IG insights). Exige `metric_type=total_value`,
 * que devolve o total da janela (nao buckets por dia). Serve para a taxa
 * "visitou o perfil -> virou seguidor".
 */
async function fetchProfileViews(
  igId: string,
  range: DateRange,
  token: string,
): Promise<number | undefined> {
  const sinceTs = spTs(range.since);
  const untilTs = spTs(range.until, true);
  try {
    const data = (await graph(
      `${igId}/insights`,
      {
        metric: 'profile_views',
        period: 'day',
        metric_type: 'total_value',
        since: String(sinceTs),
        until: String(untilTs),
      },
      token,
    )) as { data?: { name?: string; total_value?: { value?: number } }[] };

    return data.data?.find((m) => m.name === 'profile_views')?.total_value?.value;
  } catch {
    return undefined;
  }
}

/**
 * Painel de UMA campanha (por ID). Os totais e a serie diaria vem do proprio no
 * da campanha (`{campaignId}/insights`), entao ja chegam escopados — nada de
 * somar a conta inteira. Escopar por ID (nao por nome) e imune a acento,
 * parenteses e renome da campanha. Sem dados no periodo -> zeros (nao e erro:
 * campanha nova/pausada). O nome exibido vem do proprio insight.
 */
async function fetchCampaignScoped(
  campaignId: string,
  account: string,
  range: DateRange,
  timeRange: string,
  wantFollowers: boolean,
  token: string,
): Promise<AdsResponse> {
  const [totalsData, dailyData, follow, balance] = (await Promise.all([
    graph(`${campaignId}/insights`, { fields: `campaign_name,spend,impressions,clicks,actions,${VIDEO_FIELDS}`, time_range: timeRange }, token),
    graph(`${campaignId}/insights`, { fields: 'spend', time_range: timeRange, time_increment: '1' }, token),
    wantFollowers ? fetchFollowers(token) : Promise.resolve({} as Awaited<ReturnType<typeof fetchFollowers>>),
    fetchAccountBalance(account, token),
  ])) as [{ data?: InsightRow[] }, { data?: InsightRow[] }, Awaited<ReturnType<typeof fetchFollowers>>, AdsBalance | undefined];

  // Seguidores ganhos e visitas ao perfil dependem do IG (dai serem sequenciais).
  const [followersGained, profileViews] = follow.igId
    ? await Promise.all([
        wantFollowers ? fetchFollowerGrowth(follow.igId, range, token) : Promise.resolve(undefined),
        fetchProfileViews(follow.igId, range, token),
      ])
    : [undefined, undefined];

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
    ? [{ name: totalRow.campaign_name ?? 'Campanha', spend: totals.spend, clicks: totals.clicks, results: totals.results }]
    : [];

  return {
    sample: false,
    totals,
    series,
    campaigns,
    video: videoStats(totalRow, profileViews),
    followers: wantFollowers ? follow.followers : undefined,
    followersGained,
    followersHandle: wantFollowers ? follow.handle : undefined,
    balance,
    fetchedAt: new Date().toISOString(),
  };
}

/** Opcoes do painel Meta: escopar numa campanha (por ID) e/ou incluir seguidores. */
export type MetaOptions = { campaignId?: string; followers?: boolean; range?: DateRange };

// Cache simples em memoria (por instancia), chaveado por periodo + opcoes.
const cache = new Map<string, { at: number; value: AdsResponse }>();

export async function fetchMetaAds(period: PeriodId, options: MetaOptions = {}): Promise<AdsResponse> {
  const { campaignId, followers: wantFollowers = true, range: customRange } = options;
  const range = resolveAdsRange(period, customRange);
  const cacheKey = `${range.since}:${range.until}|${campaignId ?? ''}|${wantFollowers}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const { token, account } = config();
  const timeRange = metaTimeRange(range);

  if (campaignId) {
    const scoped = await fetchCampaignScoped(campaignId, account, range, timeRange, wantFollowers, token);
    cache.set(cacheKey, { at: Date.now(), value: scoped });
    return scoped;
  }

  // 1) Totais da conta. 2) Serie diaria. 3) Campanhas ativas. 4) Seguidores. 5) Saldo.
  const [totalsData, dailyData, activeCampaigns, follow, balance] = await Promise.all([
    graph(`${account}/insights`, { fields: `spend,impressions,clicks,actions,${VIDEO_FIELDS}`, time_range: timeRange, level: 'account' }, token) as Promise<{ data?: InsightRow[] }>,
    graph(`${account}/insights`, { fields: 'spend', time_range: timeRange, level: 'account', time_increment: '1' }, token) as Promise<{ data?: InsightRow[] }>,
    graph(`${account}/campaigns`, { fields: 'id,name', filtering: '[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]', limit: '100' }, token) as Promise<{ data?: { id: string; name: string }[] }>,
    wantFollowers ? fetchFollowers(token) : Promise.resolve({} as Awaited<ReturnType<typeof fetchFollowers>>),
    fetchAccountBalance(account, token),
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

  // Seguidores ganhos e visitas ao perfil (se o token tiver insights do IG).
  const [followersGained, profileViews] = follow.igId
    ? await Promise.all([
        fetchFollowerGrowth(follow.igId, range, token),
        fetchProfileViews(follow.igId, range, token),
      ])
    : [undefined, undefined];

  const value: AdsResponse = {
    sample: false,
    totals,
    series,
    campaigns,
    video: videoStats(totalRow, profileViews),
    followers: follow.followers,
    followersGained,
    followersHandle: follow.handle,
    balance,
    fetchedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}
