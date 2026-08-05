import { dayKeysBack, type PeriodId } from '../dashboard/lead-utils';

export type PlatformId = 'meta' | 'google';

/**
 * Cores de identidade da plataforma. Usadas SO em detalhes (badge, chip do
 * icone, barras do grafico) — a casca de vidro e o fundo quente da marca
 * continuam iguais aos do dashboard de leads, para os tres parecerem um so
 * produto. E identificacao pontual (Von Restorff), nao troca de paleta.
 */
export type PlatformAccent = {
  badge: string;
  chip: string;
  edge: string;
  glow: string;
  rule: string;
  bar: string;
  barHover: string;
};

export type PlatformConfig = {
  id: PlatformId;
  label: string;
  short: string;
  /** Rotulo do "resultado" de conversao — muda entre as plataformas. */
  resultLabel: string;
  accent: PlatformAccent;
  campaignNames: string[];
};

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  meta: {
    id: 'meta',
    label: 'Meta Ads',
    short: 'Meta',
    resultLabel: 'Resultados',
    accent: {
      badge: 'bg-[#0866FF]/20 text-[#7fb0ff] border-[#0866FF]/40',
      chip: 'bg-[#0866FF]/25 text-[#7fb0ff]',
      edge: 'bg-[#0866FF]',
      glow: 'bg-[#0866FF]/35',
      rule: 'via-[#0866FF]/80',
      bar: 'bg-[#2b6fff]',
      barHover: 'group-hover:bg-[#7fb0ff]',
    },
    campaignNames: [
      'Trabalhista - Reels Video',
      'Rescisao Indireta - Estatico',
      'Verbas Rescisorias - Carrossel',
      'Remarketing - Site',
    ],
  },
  google: {
    id: 'google',
    label: 'Google Ads',
    short: 'Google',
    resultLabel: 'Conversoes',
    accent: {
      badge: 'bg-[#1a9e5b]/20 text-[#5fce87] border-[#1a9e5b]/40',
      chip: 'bg-[#1a9e5b]/25 text-[#5fce87]',
      edge: 'bg-[#1a9e5b]',
      glow: 'bg-[#1a9e5b]/35',
      rule: 'via-[#1a9e5b]/80',
      bar: 'bg-[#1f9d57]',
      barHover: 'group-hover:bg-[#5fce87]',
    },
    campaignNames: [
      'Search - Advogado Trabalhista BH',
      'Search - Calculo Rescisao',
      'PMax - Direitos Trabalhistas',
      'Search - Marca',
    ],
  },
};

// ---- Dados de exemplo (deterministicos) --------------------------------------
//
// PRNG semeado por string: mesma entrada, mesma saida. Precisa ser deterministico
// para o HTML do servidor bater com o do cliente (sem erro de hidratacao) e para
// os numeros nao "dancarem" a cada atualizacao.

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DayPoint = {
  key: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

export type Campaign = {
  name: string;
  spend: number;
  clicks: number;
  conversions: number;
};

export type AdsData = {
  series: DayPoint[];
  campaigns: Campaign[];
  totals: { spend: number; impressions: number; clicks: number; conversions: number };
};

function periodDays(period: PeriodId): number {
  if (period === '14d' || period === 'all') return 14;
  if (period === '7d') return 7;
  return 1; // today / yesterday
}

/** Gera uma serie diaria estavel para a plataforma e o periodo escolhidos. */
export function sampleAdsData(platform: PlatformId, period: PeriodId, now = Date.now()): AdsData {
  const days = periodDays(period);
  const keys = dayKeysBack(days, now);
  const rand = mulberry32(hashSeed(`${platform}:${period}`));

  const series: DayPoint[] = keys.map((key) => {
    const spend = Math.round(40 + rand() * 160); // R$40 a R$200/dia
    const cpc = 0.8 + rand() * 2.2; // R$0,80 a R$3,00
    const clicks = Math.max(1, Math.round(spend / cpc));
    const ctr = 0.008 + rand() * 0.03; // 0,8% a 3,8%
    const impressions = Math.round(clicks / ctr);
    const convRate = 0.04 + rand() * 0.1; // 4% a 14%
    const conversions = Math.round(clicks * convRate);
    return { key, spend, impressions, clicks, conversions };
  });

  const totals = series.reduce(
    (acc, d) => ({
      spend: acc.spend + d.spend,
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      conversions: acc.conversions + d.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
  );

  const names = PLATFORMS[platform].campaignNames;
  // Reparte os totais entre as campanhas com pesos estaveis.
  const weights = names.map(() => 0.5 + rand());
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const campaigns: Campaign[] = names
    .map((name, i) => {
      const w = weights[i] / weightSum;
      return {
        name,
        spend: Math.round(totals.spend * w),
        clicks: Math.round(totals.clicks * w),
        conversions: Math.round(totals.conversions * w),
      };
    })
    .sort((a, b) => b.spend - a.spend);

  return { series, campaigns, totals };
}
