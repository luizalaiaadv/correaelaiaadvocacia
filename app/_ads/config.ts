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
  /** Rotulo do "resultado" (plural) e a forma singular, para "Custo/{singular}". */
  resultLabel: string;
  resultSingular: string;
  accent: PlatformAccent;
};

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  meta: {
    id: 'meta',
    label: 'Meta Ads',
    short: 'Meta',
    resultLabel: 'Resultados',
    resultSingular: 'resultado',
    accent: {
      badge: 'bg-[#0866FF]/20 text-[#7fb0ff] border-[#0866FF]/40',
      chip: 'bg-[#0866FF]/25 text-[#7fb0ff]',
      edge: 'bg-[#0866FF]',
      glow: 'bg-[#0866FF]/35',
      rule: 'via-[#0866FF]/80',
      bar: 'bg-[#2b6fff]',
      barHover: 'group-hover:bg-[#7fb0ff]',
    },
  },
  google: {
    id: 'google',
    label: 'Google Ads',
    short: 'Google',
    resultLabel: 'Conversões',
    resultSingular: 'conversão',
    accent: {
      badge: 'bg-[#1a9e5b]/20 text-[#5fce87] border-[#1a9e5b]/40',
      chip: 'bg-[#1a9e5b]/25 text-[#5fce87]',
      edge: 'bg-[#1a9e5b]',
      glow: 'bg-[#1a9e5b]/35',
      rule: 'via-[#1a9e5b]/80',
      bar: 'bg-[#1f9d57]',
      barHover: 'group-hover:bg-[#5fce87]',
    },
  },
};

/**
 * Nomes EXATOS (como vem da API do Meta) das campanhas fixadas em cada aba de
 * ads. Se a cliente trocar de campanha, e aqui que se atualiza.
 */
export const META_CAMPAIGNS = {
  fgts: '[28/07/26] [Escritório] [Tráfego] FGTS',
} as const;

/**
 * Abas de ADS (Meta e Google). A aba Typebot NAO entra aqui: ela mostra a lista
 * de leads (`<LeadsPanel/>`), nao um painel de campanha.
 */
export type TabId = PlatformId | 'typebot';

export type TabConfig = PlatformConfig & {
  /** Escopar o painel numa unica campanha (nome exato). */
  campaign?: string;
};

export const TABS: Record<PlatformId, TabConfig> = {
  // Meta: so a campanha de trafego FGTS (Resultados = cliques no link; mantem seguidores).
  meta: { ...PLATFORMS.meta, campaign: META_CAMPAIGNS.fgts },
  // Google: conta inteira (todas as campanhas ativas), como antes.
  google: { ...PLATFORMS.google },
};
